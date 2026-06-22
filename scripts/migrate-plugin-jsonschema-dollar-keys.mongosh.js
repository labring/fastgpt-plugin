/*
 * Usage:
 *   mongosh "mongodb://host:27017/dbname" scripts/migrate-plugin-jsonschema-dollar-keys.mongosh.js
 */

/* global db, printjson */

const MONGO_DOLLAR_KEY_PREFIX = '__fastgpt_mongo_dollar__';
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

function encodeKey(key) {
  if (key.startsWith(MONGO_DOLLAR_KEY_PREFIX)) {
    return MONGO_DOLLAR_KEY_PREFIX + key;
  }

  return key.startsWith('$') ? MONGO_DOLLAR_KEY_PREFIX + key.slice(1) : key;
}

function encodeSchemaNode(value) {
  if (Array.isArray(value)) {
    let changed = false;
    const nextValue = value.map((item) => {
      const result = encodeSchemaNode(item);
      changed = changed || result.changed;
      return result.value;
    });
    return {
      value: changed ? nextValue : value,
      changed
    };
  }

  if (!isRecord(value)) {
    return {
      value,
      changed: false
    };
  }

  let changed = false;
  const nextValue = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextKey = encodeKey(key);
    const result = encodeSchemaNode(nestedValue);
    changed = changed || nextKey !== key || result.changed;
    nextValue[nextKey] = result.value;
  }

  return {
    value: changed ? nextValue : value,
    changed
  };
}

function encodeSchemaField(target, fieldName) {
  if (!hasOwn(target, fieldName)) {
    return false;
  }

  const result = encodeSchemaNode(target[fieldName]);
  if (!result.changed) {
    return false;
  }

  target[fieldName] = result.value;
  return true;
}

function encodePluginDataMongoKeys(data) {
  if (!isRecord(data)) {
    return {
      value: data,
      changed: false
    };
  }

  let changed = false;
  const nextData = Object.assign({}, data);

  for (const fieldName of SCHEMA_FIELD_NAMES) {
    changed = encodeSchemaField(nextData, fieldName) || changed;
  }

  if (Array.isArray(nextData.children)) {
    let childrenChanged = false;
    const nextChildren = nextData.children.map((child) => {
      if (!isRecord(child)) {
        return child;
      }

      const nextChild = Object.assign({}, child);
      for (const fieldName of CHILD_SCHEMA_FIELD_NAMES) {
        childrenChanged = encodeSchemaField(nextChild, fieldName) || childrenChanged;
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
    changed
  };
}

let scannedCount = 0;
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

collection.find({}, { projection: { data: 1 } }).forEach((doc) => {
  scannedCount += 1;

  const result = encodePluginDataMongoKeys(doc.data);
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
  matchedCount,
  modifiedCount
});
