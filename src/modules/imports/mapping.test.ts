import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageGroupFromText,
  assignColumn,
  checkIdColumn,
  countFilled,
  sampleValues,
  type ColumnMap,
  distinctValues,
  mapRows,
  suggestColumnMap,
  suggestValueMap,
  unmappedValues,
} from "./mapping.ts";

const headers = ["Nº", "Nome do Animal", "Espécie", "Sexo", "Porte", "Idade", "Castrado(a)", "Vacinado(a)", "Situação", "Observações"];

const rows = [
  { "Nº": "1", "Nome do Animal": "Rex", "Espécie": "Cachorro", "Sexo": "M", "Porte": "Médio", "Idade": "2 anos", "Castrado(a)": "Sim", "Vacinado(a)": "sim", "Situação": "Disponível", "Observações": "Dócil" },
  { "Nº": "2", "Nome do Animal": "Mimi", "Espécie": "gata", "Sexo": "Fêmea", "Porte": "P", "Idade": "4 meses", "Castrado(a)": "Não", "Vacinado(a)": "", "Situação": "Adotada", "Observações": "" },
  { "Nº": "3", "Nome do Animal": "Thor", "Espécie": "Canino", "Sexo": "macho", "Porte": "GG", "Idade": "idoso", "Castrado(a)": "sim", "Vacinado(a)": "V10 em dia", "Situação": "LT", "Observações": "" },
  { "Nº": "", "Nome do Animal": "", "Espécie": "", "Sexo": "", "Porte": "", "Idade": "", "Castrado(a)": "", "Vacinado(a)": "", "Situação": "", "Observações": "" },
];

test("sugere colunas por sinônimos, ignorando acentos e maiúsculas", () => {
  const map = suggestColumnMap(headers);
  assert.equal(map.name, "Nome do Animal");
  assert.equal(map.species, "Espécie");
  assert.equal(map.sex, "Sexo");
  assert.equal(map.size, "Porte");
  assert.equal(map.age_group, "Idade");
  assert.equal(map.neutered, "Castrado(a)");
  assert.equal(map.vaccinated, "Vacinado(a)");
  assert.equal(map.status, "Situação");
  assert.equal(map.description, "Observações");
  assert.equal(map.external_id, "Nº");
});

test("idade em texto vira faixa", () => {
  assert.equal(ageGroupFromText("4 meses"), "puppy");
  assert.equal(ageGroupFromText("2 anos"), "young");
  assert.equal(ageGroupFromText("5 anos"), "adult");
  assert.equal(ageGroupFromText("10 anos"), "senior");
  assert.equal(ageGroupFromText("1,5 ano"), "young");
});

test("valores distintos com contagem", () => {
  const d = distinctValues(rows, "Sexo");
  assert.deepEqual(d.map((x) => x.normalized).sort(), ["femea", "m", "macho"]);
});

test("aponta valores sem correspondência e aceita o mapeamento salvo pela ONG", () => {
  const columnMap = suggestColumnMap(headers);
  const valueMap = suggestValueMap(rows, columnMap);
  const missing = unmappedValues(rows, { columnMap, valueMap });
  assert.deepEqual(missing.size?.map((v) => v.sample), ["GG"]);
  assert.deepEqual(missing.status?.map((v) => v.sample), ["LT"]);
  assert.deepEqual(missing.vaccinated?.map((v) => v.sample), ["V10 em dia"]);

  valueMap.size = { ...valueMap.size, gg: "large" };
  valueMap.status = { ...valueMap.status, lt: "unavailable" };
  valueMap.vaccinated = { ...valueMap.vaccinated, "v10 em dia": "true" };
  const result = mapRows(rows, { columnMap, valueMap });

  assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
  assert.equal(result.animals.length, 3, "linha vazia ignorada");
  const [rex, mimi, thor] = result.animals;
  assert.equal(rex.external_id, "1");
  assert.deepEqual(
    { species: rex.values.species, sex: rex.values.sex, size: rex.values.size, age: rex.values.age_group, neutered: rex.values.neutered },
    { species: "dog", sex: "male", size: "medium", age: "young", neutered: true },
  );
  assert.equal(mimi.values.species, "cat");
  assert.equal(mimi.values.status, "adopted");
  assert.equal(mimi.values.neutered, false);
  assert.equal(mimi.values.vaccinated, null);
  assert.equal(mimi.values.description, null);
  assert.equal(thor.values.size, "large");
  assert.equal(thor.values.age_group, "senior");
  assert.equal(thor.values.vaccinated, true);
  assert.equal(thor.row, 4);
});

test("nomes repetidos são permitidos; o ID diferencia os animais", () => {
  const result = mapRows(
    [
      { ID: "10", Nome: "Bolt" },
      { ID: "11", Nome: "Bolt" },
    ],
    { columnMap: { external_id: "ID", name: "Nome" }, valueMap: {} },
  );
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.animals.map((a) => a.external_id), ["10", "11"]);
});

test("erros por linha: valor desconhecido, nome vazio, ID vazio e ID repetido", () => {
  const columnMap = { external_id: "ID", name: "Nome", species: "Espécie" };
  const result = mapRows(
    [
      { ID: "A1", Nome: "Bolt", Espécie: "Cachorro" },
      { ID: "A2", Nome: "", Espécie: "Gato" },
      { ID: "A1", Nome: "Rex", Espécie: "Coelho" },
      { ID: "", Nome: "Sem ID", Espécie: "Gato" },
    ],
    { columnMap, valueMap: {} },
  );
  assert.equal(result.animals.length, 1);
  assert.equal(result.animals[0].external_id, "A1");
  assert.deepEqual(
    result.errors.map((e) => e.row),
    [3, 4, 5],
  );
  assert.match(result.errors[0].messages.join(" | "), /Nome vazio/);
  assert.match(result.errors[1].messages.join(" | "), /Coelho/);
  assert.match(result.errors[1].messages.join(" | "), /ID "A1" repetido \(também na linha 2\)/);
  assert.match(result.errors[2].messages.join(" | "), /ID vazio/);
});

test("sem coluna de ID (ou de nome) não importa nada", () => {
  const semId = mapRows([{ Nome: "Luna" }], { columnMap: { name: "Nome" }, valueMap: {} });
  assert.equal(semId.animals.length, 0);
  assert.match(semId.errors[0].messages.join(), /ID do animal/);

  const semNome = mapRows([{ ID: "1" }], { columnMap: { external_id: "ID" }, valueMap: {} });
  assert.equal(semNome.animals.length, 0);
  assert.match(semNome.errors[0].messages.join(), /Nome/);
});

test("colunas não mapeadas não aparecem (não sobrescrevem dados na atualização)", () => {
  const result = mapRows([{ ID: "7", Nome: "Luna" }], { columnMap: { external_id: "ID", name: "Nome" }, valueMap: {} });
  assert.deepEqual(Object.keys(result.animals[0].values), ["name"]);
});

test("exemplos da coluna: distintos, sem vazios, cortados", () => {
  const rows = [{ A: "Rex" }, { A: "" }, { A: "Rex" }, { A: "Mimi" }, { A: "x".repeat(60) }, { A: "Thor" }];
  const s = sampleValues(rows, "A");
  assert.deepEqual(s.slice(0, 2), ["Rex", "Mimi"]);
  assert.equal(s.length, 3);
  assert.ok(s[2].endsWith("…") && s[2].length === 40);
  assert.equal(countFilled(rows, "A"), 5);
});

test("checagem da coluna de ID aponta vazios e repetidos com o número da linha", () => {
  const rows = [{ ID: "1" }, { ID: "2" }, { ID: "" , Nome: "Sem" }, { ID: "2" }, { ID: "" }];
  const c = checkIdColumn(rows, "ID");
  assert.equal(c.total, 4, "linha totalmente vazia não conta");
  assert.deepEqual(c.emptyRows, [4]);
  assert.deepEqual(c.duplicates, [{ value: "2", rows: [3, 5] }]);
});

test("atribuir coluna mantém cada campo em uma coluna só", () => {
  let m: ColumnMap = { name: "Nome", sex: "Sexo" };
  m = assignColumn(m, "Sexo", "species");
  assert.deepEqual(m, { name: "Nome", species: "Sexo" });
  m = assignColumn(m, "Tipo", "species");
  assert.deepEqual(m, { name: "Nome", species: "Tipo" });
  m = assignColumn(m, "Tipo", null);
  assert.deepEqual(m, { name: "Nome" });
});
