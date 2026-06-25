/*
 * Usage:
 *   mongosh "mongodb://host:27017/dbname" scripts/migrate-plugin-jsonschema-string-fields.mongosh.js
 */

/* global db, printjson */

const SCHEMA_FIELD_NAMES = ['inputSchema', 'outputSchema', 'secretSchema'];
const CHILD_SCHEMA_FIELD_NAMES = ['inputSchema', 'outputSchema'];
const BATCH_SIZE = 500;

const collection = db.getCollection('system_plugins');

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return (
    value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
  );
}

function stringifySchemaField(target, fieldName) {
  if (!hasOwn(target, fieldName)) {
    return {
      changed: false,
      candidateCount: 0,
      alreadyStringCount: 0
    };
  }

  if (typeof target[fieldName] === 'string') {
    return {
      changed: false,
      candidateCount: 1,
      alreadyStringCount: 1
    };
  }

  const stringifiedValue = JSON.stringify(target[fieldName]);
  if (stringifiedValue === undefined) {
    return {
      changed: false,
      candidateCount: 1,
      alreadyStringCount: 0
    };
  }

  target[fieldName] = stringifiedValue;
  return {
    changed: true,
    candidateCount: 1,
    alreadyStringCount: 0
  };
}

function stringifyPluginDataSchemaFields(data) {
  if (!isRecord(data)) {
    return {
      value: data,
      changed: false,
      candidateCount: 0,
      alreadyStringCount: 0
    };
  }

  let changed = false;
  let candidateCount = 0;
  let alreadyStringCount = 0;
  const nextData = Object.assign({}, data);

  for (const fieldName of SCHEMA_FIELD_NAMES) {
    const result = stringifySchemaField(nextData, fieldName);
    candidateCount += result.candidateCount;
    alreadyStringCount += result.alreadyStringCount;
    changed = result.changed || changed;
  }

  if (Array.isArray(nextData.children)) {
    let childrenChanged = false;
    const nextChildren = nextData.children.map((child) => {
      if (!isRecord(child)) {
        return child;
      }

      const nextChild = Object.assign({}, child);
      for (const fieldName of CHILD_SCHEMA_FIELD_NAMES) {
        const result = stringifySchemaField(nextChild, fieldName);
        candidateCount += result.candidateCount;
        alreadyStringCount += result.alreadyStringCount;
        childrenChanged = result.changed || childrenChanged;
      }
      return nextChild;
    });

    if (childrenChanged) {
      nextData.children = nextChildren;
      changed = true;
    }
  }

  return {
    value: changed ? nextData : data,
    changed,
    candidateCount,
    alreadyStringCount
  };
}

let scannedCount = 0;
let candidateCount = 0;
let alreadyStringCount = 0;
let matchedCount = 0;
let modifiedCount = 0;
let operations = [];

function flush() {
  if (operations.length === 0) {
    return;
  }

  const result = collection.bulkWrite(operations, { ordered: false });
  matchedCount += result.matchedCount;
  modifiedCount += result.modifiedCount;
  operations = [];
}

collection.find({}, { data: 1 }).forEach((doc) => {
  scannedCount += 1;

  const result = stringifyPluginDataSchemaFields(doc.data);
  candidateCount += result.candidateCount;
  alreadyStringCount += result.alreadyStringCount;
  if (!result.changed) {
    return;
  }

  operations.push({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          data: result.value
        }
      }
    }
  });

  if (operations.length >= BATCH_SIZE) {
    flush();
  }
});

flush();

printjson({
  collection: collection.getName(),
  scannedCount,
  candidateCount,
  alreadyStringCount,
  matchedCount,
  modifiedCount
});
