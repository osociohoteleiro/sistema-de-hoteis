// node_modules/@smithy/types/dist-es/middleware.js
var SMITHY_CONTEXT_KEY = "__smithy_context";

// node_modules/@smithy/types/dist-es/auth/auth.js
var HttpAuthLocation;
(function(HttpAuthLocation2) {
  HttpAuthLocation2["HEADER"] = "header";
  HttpAuthLocation2["QUERY"] = "query";
})(HttpAuthLocation || (HttpAuthLocation = {}));

// node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js
var HttpApiKeyAuthLocation;
(function(HttpApiKeyAuthLocation2) {
  HttpApiKeyAuthLocation2["HEADER"] = "header";
  HttpApiKeyAuthLocation2["QUERY"] = "query";
})(HttpApiKeyAuthLocation || (HttpApiKeyAuthLocation = {}));

// node_modules/@smithy/types/dist-es/endpoint.js
var EndpointURLScheme;
(function(EndpointURLScheme2) {
  EndpointURLScheme2["HTTP"] = "http";
  EndpointURLScheme2["HTTPS"] = "https";
})(EndpointURLScheme || (EndpointURLScheme = {}));

// node_modules/@smithy/types/dist-es/extensions/checksum.js
var AlgorithmId;
(function(AlgorithmId2) {
  AlgorithmId2["MD5"] = "md5";
  AlgorithmId2["CRC32"] = "crc32";
  AlgorithmId2["CRC32C"] = "crc32c";
  AlgorithmId2["SHA1"] = "sha1";
  AlgorithmId2["SHA256"] = "sha256";
})(AlgorithmId || (AlgorithmId = {}));

// node_modules/@smithy/types/dist-es/http.js
var FieldPosition;
(function(FieldPosition2) {
  FieldPosition2[FieldPosition2["HEADER"] = 0] = "HEADER";
  FieldPosition2[FieldPosition2["TRAILER"] = 1] = "TRAILER";
})(FieldPosition || (FieldPosition = {}));

// node_modules/@smithy/types/dist-es/profile.js
var IniSectionType;
(function(IniSectionType2) {
  IniSectionType2["PROFILE"] = "profile";
  IniSectionType2["SSO_SESSION"] = "sso-session";
  IniSectionType2["SERVICES"] = "services";
})(IniSectionType || (IniSectionType = {}));

// node_modules/@smithy/types/dist-es/transfer.js
var RequestHandlerProtocol;
(function(RequestHandlerProtocol2) {
  RequestHandlerProtocol2["HTTP_0_9"] = "http/0.9";
  RequestHandlerProtocol2["HTTP_1_0"] = "http/1.0";
  RequestHandlerProtocol2["TDS_8_0"] = "tds/8.0";
})(RequestHandlerProtocol || (RequestHandlerProtocol = {}));

// node_modules/@smithy/protocol-http/dist-es/httpRequest.js
var HttpRequest = class _HttpRequest {
  constructor(options) {
    this.method = options.method || "GET";
    this.hostname = options.hostname || "localhost";
    this.port = options.port;
    this.query = options.query || {};
    this.headers = options.headers || {};
    this.body = options.body;
    this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
    this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
    this.username = options.username;
    this.password = options.password;
    this.fragment = options.fragment;
  }
  static clone(request) {
    const cloned = new _HttpRequest({
      ...request,
      headers: { ...request.headers }
    });
    if (cloned.query) {
      cloned.query = cloneQuery(cloned.query);
    }
    return cloned;
  }
  static isInstance(request) {
    if (!request) {
      return false;
    }
    const req = request;
    return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
  }
  clone() {
    return _HttpRequest.clone(this);
  }
};
function cloneQuery(query) {
  return Object.keys(query).reduce((carry, paramName) => {
    const param = query[paramName];
    return {
      ...carry,
      [paramName]: Array.isArray(param) ? [...param] : param
    };
  }, {});
}

// node_modules/@smithy/protocol-http/dist-es/extensions/httpExtensionConfiguration.js
var getHttpHandlerExtensionConfiguration = (runtimeConfig) => {
  return {
    setHttpHandler(handler) {
      runtimeConfig.httpHandler = handler;
    },
    httpHandler() {
      return runtimeConfig.httpHandler;
    },
    updateHttpClientConfig(key, value) {
      runtimeConfig.httpHandler?.updateHttpClientConfig(key, value);
    },
    httpHandlerConfigs() {
      return runtimeConfig.httpHandler.httpHandlerConfigs();
    }
  };
};
var resolveHttpHandlerRuntimeConfig = (httpHandlerExtensionConfiguration) => {
  return {
    httpHandler: httpHandlerExtensionConfiguration.httpHandler()
  };
};

// node_modules/@smithy/protocol-http/dist-es/httpResponse.js
var HttpResponse = class {
  constructor(options) {
    this.statusCode = options.statusCode;
    this.reason = options.reason;
    this.headers = options.headers || {};
    this.body = options.body;
  }
  static isInstance(response) {
    if (!response)
      return false;
    const resp = response;
    return typeof resp.statusCode === "number" && typeof resp.headers === "object";
  }
};

// node_modules/@smithy/protocol-http/dist-es/isValidHostname.js
function isValidHostname(hostname) {
  const hostPattern = /^[a-z0-9][a-z0-9\.\-]*[a-z0-9]$/;
  return hostPattern.test(hostname);
}

// node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
var fromUtf8 = (input) => new TextEncoder().encode(input);

// node_modules/@smithy/util-utf8/dist-es/toUint8Array.js
var toUint8Array = (data) => {
  if (typeof data === "string") {
    return fromUtf8(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
};

// node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js
var toUtf8 = (input) => {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
    throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
  }
  return new TextDecoder("utf-8").decode(input);
};

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/sentinels.js
var SCHEMA = {
  BLOB: 21,
  STREAMING_BLOB: 42,
  BOOLEAN: 2,
  STRING: 0,
  NUMERIC: 1,
  BIG_INTEGER: 17,
  BIG_DECIMAL: 19,
  DOCUMENT: 15,
  TIMESTAMP_DEFAULT: 4,
  TIMESTAMP_DATE_TIME: 5,
  TIMESTAMP_HTTP_DATE: 6,
  TIMESTAMP_EPOCH_SECONDS: 7,
  LIST_MODIFIER: 64,
  MAP_MODIFIER: 128
};

// node_modules/@smithy/core/dist-es/submodules/schema/deref.js
var deref = (schemaRef) => {
  if (typeof schemaRef === "function") {
    return schemaRef();
  }
  return schemaRef;
};

// node_modules/@smithy/util-middleware/dist-es/getSmithyContext.js
var getSmithyContext = (context) => context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {});

// node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js
var normalizeProvider = (input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
};

// node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js
var TypeRegistry = class _TypeRegistry {
  constructor(namespace, schemas = /* @__PURE__ */ new Map()) {
    this.namespace = namespace;
    this.schemas = schemas;
  }
  static for(namespace) {
    if (!_TypeRegistry.registries.has(namespace)) {
      _TypeRegistry.registries.set(namespace, new _TypeRegistry(namespace));
    }
    return _TypeRegistry.registries.get(namespace);
  }
  register(shapeId, schema) {
    const qualifiedName = this.normalizeShapeId(shapeId);
    const registry = _TypeRegistry.for(this.getNamespace(shapeId));
    registry.schemas.set(qualifiedName, schema);
  }
  getSchema(shapeId) {
    const id = this.normalizeShapeId(shapeId);
    if (!this.schemas.has(id)) {
      throw new Error(`@smithy/core/schema - schema not found for ${id}`);
    }
    return this.schemas.get(id);
  }
  getBaseException() {
    for (const [id, schema] of this.schemas.entries()) {
      if (id.startsWith("smithy.ts.sdk.synthetic.") && id.endsWith("ServiceException")) {
        return schema;
      }
    }
    return void 0;
  }
  find(predicate) {
    return [...this.schemas.values()].find(predicate);
  }
  destroy() {
    _TypeRegistry.registries.delete(this.namespace);
    this.schemas.clear();
  }
  normalizeShapeId(shapeId) {
    if (shapeId.includes("#")) {
      return shapeId;
    }
    return this.namespace + "#" + shapeId;
  }
  getNamespace(shapeId) {
    return this.normalizeShapeId(shapeId).split("#")[0];
  }
};
TypeRegistry.registries = /* @__PURE__ */ new Map();

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/Schema.js
var Schema = class {
  constructor(name, traits) {
    this.name = name;
    this.traits = traits;
  }
};

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/ListSchema.js
var ListSchema = class _ListSchema extends Schema {
  constructor(name, traits, valueSchema) {
    super(name, traits);
    this.name = name;
    this.traits = traits;
    this.valueSchema = valueSchema;
    this.symbol = _ListSchema.symbol;
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _ListSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const list = lhs;
      return list.symbol === _ListSchema.symbol;
    }
    return isPrototype;
  }
};
ListSchema.symbol = Symbol.for("@smithy/core/schema::ListSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/MapSchema.js
var MapSchema = class _MapSchema extends Schema {
  constructor(name, traits, keySchema, valueSchema) {
    super(name, traits);
    this.name = name;
    this.traits = traits;
    this.keySchema = keySchema;
    this.valueSchema = valueSchema;
    this.symbol = _MapSchema.symbol;
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _MapSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const map = lhs;
      return map.symbol === _MapSchema.symbol;
    }
    return isPrototype;
  }
};
MapSchema.symbol = Symbol.for("@smithy/core/schema::MapSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/StructureSchema.js
var StructureSchema = class _StructureSchema extends Schema {
  constructor(name, traits, memberNames, memberList) {
    super(name, traits);
    this.name = name;
    this.traits = traits;
    this.memberNames = memberNames;
    this.memberList = memberList;
    this.symbol = _StructureSchema.symbol;
    this.members = {};
    for (let i = 0; i < memberNames.length; ++i) {
      this.members[memberNames[i]] = Array.isArray(memberList[i]) ? memberList[i] : [memberList[i], 0];
    }
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _StructureSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const struct = lhs;
      return struct.symbol === _StructureSchema.symbol;
    }
    return isPrototype;
  }
};
StructureSchema.symbol = Symbol.for("@smithy/core/schema::StructureSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/ErrorSchema.js
var ErrorSchema = class _ErrorSchema extends StructureSchema {
  constructor(name, traits, memberNames, memberList, ctor) {
    super(name, traits, memberNames, memberList);
    this.name = name;
    this.traits = traits;
    this.memberNames = memberNames;
    this.memberList = memberList;
    this.ctor = ctor;
    this.symbol = _ErrorSchema.symbol;
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _ErrorSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const err = lhs;
      return err.symbol === _ErrorSchema.symbol;
    }
    return isPrototype;
  }
};
ErrorSchema.symbol = Symbol.for("@smithy/core/schema::ErrorSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/SimpleSchema.js
var SimpleSchema = class _SimpleSchema extends Schema {
  constructor(name, schemaRef, traits) {
    super(name, traits);
    this.name = name;
    this.schemaRef = schemaRef;
    this.traits = traits;
    this.symbol = _SimpleSchema.symbol;
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _SimpleSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const sim = lhs;
      return sim.symbol === _SimpleSchema.symbol;
    }
    return isPrototype;
  }
};
SimpleSchema.symbol = Symbol.for("@smithy/core/schema::SimpleSchema");

// node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js
var NormalizedSchema = class _NormalizedSchema {
  constructor(ref, memberName) {
    this.ref = ref;
    this.memberName = memberName;
    this.symbol = _NormalizedSchema.symbol;
    const traitStack = [];
    let _ref = ref;
    let schema = ref;
    this._isMemberSchema = false;
    while (Array.isArray(_ref)) {
      traitStack.push(_ref[1]);
      _ref = _ref[0];
      schema = deref(_ref);
      this._isMemberSchema = true;
    }
    if (traitStack.length > 0) {
      this.memberTraits = {};
      for (let i = traitStack.length - 1; i >= 0; --i) {
        const traitSet = traitStack[i];
        Object.assign(this.memberTraits, _NormalizedSchema.translateTraits(traitSet));
      }
    } else {
      this.memberTraits = 0;
    }
    if (schema instanceof _NormalizedSchema) {
      this.name = schema.name;
      this.traits = schema.traits;
      this._isMemberSchema = schema._isMemberSchema;
      this.schema = schema.schema;
      this.memberTraits = Object.assign({}, schema.getMemberTraits(), this.getMemberTraits());
      this.normalizedTraits = void 0;
      this.ref = schema.ref;
      this.memberName = memberName ?? schema.memberName;
      return;
    }
    this.schema = deref(schema);
    if (this.schema && typeof this.schema === "object") {
      this.traits = this.schema?.traits ?? {};
    } else {
      this.traits = 0;
    }
    this.name = (typeof this.schema === "object" ? this.schema?.name : void 0) ?? this.memberName ?? this.getSchemaName();
    if (this._isMemberSchema && !memberName) {
      throw new Error(`@smithy/core/schema - NormalizedSchema member schema ${this.getName(true)} must initialize with memberName argument.`);
    }
  }
  static [Symbol.hasInstance](lhs) {
    const isPrototype = _NormalizedSchema.prototype.isPrototypeOf(lhs);
    if (!isPrototype && typeof lhs === "object" && lhs !== null) {
      const ns = lhs;
      return ns.symbol === _NormalizedSchema.symbol;
    }
    return isPrototype;
  }
  static of(ref, memberName) {
    if (ref instanceof _NormalizedSchema) {
      return ref;
    }
    return new _NormalizedSchema(ref, memberName);
  }
  static translateTraits(indicator) {
    if (typeof indicator === "object") {
      return indicator;
    }
    indicator = indicator | 0;
    const traits = {};
    if ((indicator & 1) === 1) {
      traits.httpLabel = 1;
    }
    if ((indicator >> 1 & 1) === 1) {
      traits.idempotent = 1;
    }
    if ((indicator >> 2 & 1) === 1) {
      traits.idempotencyToken = 1;
    }
    if ((indicator >> 3 & 1) === 1) {
      traits.sensitive = 1;
    }
    if ((indicator >> 4 & 1) === 1) {
      traits.httpPayload = 1;
    }
    if ((indicator >> 5 & 1) === 1) {
      traits.httpResponseCode = 1;
    }
    if ((indicator >> 6 & 1) === 1) {
      traits.httpQueryParams = 1;
    }
    return traits;
  }
  static memberFrom(memberSchema, memberName) {
    if (memberSchema instanceof _NormalizedSchema) {
      memberSchema.memberName = memberName;
      memberSchema._isMemberSchema = true;
      return memberSchema;
    }
    return new _NormalizedSchema(memberSchema, memberName);
  }
  getSchema() {
    if (this.schema instanceof _NormalizedSchema) {
      return this.schema = this.schema.getSchema();
    }
    if (this.schema instanceof SimpleSchema) {
      return deref(this.schema.schemaRef);
    }
    return deref(this.schema);
  }
  getName(withNamespace = false) {
    if (!withNamespace) {
      if (this.name && this.name.includes("#")) {
        return this.name.split("#")[1];
      }
    }
    return this.name || void 0;
  }
  getMemberName() {
    if (!this.isMemberSchema()) {
      throw new Error(`@smithy/core/schema - cannot get member name on non-member schema: ${this.getName(true)}`);
    }
    return this.memberName;
  }
  isMemberSchema() {
    return this._isMemberSchema;
  }
  isUnitSchema() {
    return this.getSchema() === "unit";
  }
  isListSchema() {
    const inner = this.getSchema();
    if (typeof inner === "number") {
      return inner >= SCHEMA.LIST_MODIFIER && inner < SCHEMA.MAP_MODIFIER;
    }
    return inner instanceof ListSchema;
  }
  isMapSchema() {
    const inner = this.getSchema();
    if (typeof inner === "number") {
      return inner >= SCHEMA.MAP_MODIFIER && inner <= 255;
    }
    return inner instanceof MapSchema;
  }
  isDocumentSchema() {
    return this.getSchema() === SCHEMA.DOCUMENT;
  }
  isStructSchema() {
    const inner = this.getSchema();
    return inner !== null && typeof inner === "object" && "members" in inner || inner instanceof StructureSchema;
  }
  isBlobSchema() {
    return this.getSchema() === SCHEMA.BLOB || this.getSchema() === SCHEMA.STREAMING_BLOB;
  }
  isTimestampSchema() {
    const schema = this.getSchema();
    return typeof schema === "number" && schema >= SCHEMA.TIMESTAMP_DEFAULT && schema <= SCHEMA.TIMESTAMP_EPOCH_SECONDS;
  }
  isStringSchema() {
    return this.getSchema() === SCHEMA.STRING;
  }
  isBooleanSchema() {
    return this.getSchema() === SCHEMA.BOOLEAN;
  }
  isNumericSchema() {
    return this.getSchema() === SCHEMA.NUMERIC;
  }
  isBigIntegerSchema() {
    return this.getSchema() === SCHEMA.BIG_INTEGER;
  }
  isBigDecimalSchema() {
    return this.getSchema() === SCHEMA.BIG_DECIMAL;
  }
  isStreaming() {
    const streaming = !!this.getMergedTraits().streaming;
    if (streaming) {
      return true;
    }
    return this.getSchema() === SCHEMA.STREAMING_BLOB;
  }
  isIdempotencyToken() {
    if (typeof this.traits === "number") {
      return (this.traits & 4) === 4;
    } else if (typeof this.traits === "object") {
      return !!this.traits.idempotencyToken;
    }
    return false;
  }
  getMergedTraits() {
    if (this.normalizedTraits) {
      return this.normalizedTraits;
    }
    this.normalizedTraits = {
      ...this.getOwnTraits(),
      ...this.getMemberTraits()
    };
    return this.normalizedTraits;
  }
  getMemberTraits() {
    return _NormalizedSchema.translateTraits(this.memberTraits);
  }
  getOwnTraits() {
    return _NormalizedSchema.translateTraits(this.traits);
  }
  getKeySchema() {
    if (this.isDocumentSchema()) {
      return _NormalizedSchema.memberFrom([SCHEMA.DOCUMENT, 0], "key");
    }
    if (!this.isMapSchema()) {
      throw new Error(`@smithy/core/schema - cannot get key schema for non-map schema: ${this.getName(true)}`);
    }
    const schema = this.getSchema();
    if (typeof schema === "number") {
      return _NormalizedSchema.memberFrom([63 & schema, 0], "key");
    }
    return _NormalizedSchema.memberFrom([schema.keySchema, 0], "key");
  }
  getValueSchema() {
    const schema = this.getSchema();
    if (typeof schema === "number") {
      if (this.isMapSchema()) {
        return _NormalizedSchema.memberFrom([63 & schema, 0], "value");
      } else if (this.isListSchema()) {
        return _NormalizedSchema.memberFrom([63 & schema, 0], "member");
      }
    }
    if (schema && typeof schema === "object") {
      if (this.isStructSchema()) {
        throw new Error(`cannot call getValueSchema() with StructureSchema ${this.getName(true)}`);
      }
      const collection = schema;
      if ("valueSchema" in collection) {
        if (this.isMapSchema()) {
          return _NormalizedSchema.memberFrom([collection.valueSchema, 0], "value");
        } else if (this.isListSchema()) {
          return _NormalizedSchema.memberFrom([collection.valueSchema, 0], "member");
        }
      }
    }
    if (this.isDocumentSchema()) {
      return _NormalizedSchema.memberFrom([SCHEMA.DOCUMENT, 0], "value");
    }
    throw new Error(`@smithy/core/schema - the schema ${this.getName(true)} does not have a value member.`);
  }
  hasMemberSchema(member) {
    if (this.isStructSchema()) {
      const struct = this.getSchema();
      return member in struct.members;
    }
    return false;
  }
  getMemberSchema(member) {
    if (this.isStructSchema()) {
      const struct = this.getSchema();
      if (!(member in struct.members)) {
        throw new Error(`@smithy/core/schema - the schema ${this.getName(true)} does not have a member with name=${member}.`);
      }
      return _NormalizedSchema.memberFrom(struct.members[member], member);
    }
    if (this.isDocumentSchema()) {
      return _NormalizedSchema.memberFrom([SCHEMA.DOCUMENT, 0], member);
    }
    throw new Error(`@smithy/core/schema - the schema ${this.getName(true)} does not have members.`);
  }
  getMemberSchemas() {
    const { schema } = this;
    const struct = schema;
    if (!struct || typeof struct !== "object") {
      return {};
    }
    if ("members" in struct) {
      const buffer = {};
      for (const member of struct.memberNames) {
        buffer[member] = this.getMemberSchema(member);
      }
      return buffer;
    }
    return {};
  }
  getEventStreamMember() {
    if (this.isStructSchema()) {
      for (const [memberName, memberSchema] of this.structIterator()) {
        if (memberSchema.isStreaming() && memberSchema.isStructSchema()) {
          return memberName;
        }
      }
    }
    return "";
  }
  *structIterator() {
    if (this.isUnitSchema()) {
      return;
    }
    if (!this.isStructSchema()) {
      throw new Error("@smithy/core/schema - cannot acquire structIterator on non-struct schema.");
    }
    const struct = this.getSchema();
    for (let i = 0; i < struct.memberNames.length; ++i) {
      yield [struct.memberNames[i], _NormalizedSchema.memberFrom([struct.memberList[i], 0], struct.memberNames[i])];
    }
  }
  getSchemaName() {
    const schema = this.getSchema();
    if (typeof schema === "number") {
      const _schema = 63 & schema;
      const container = 192 & schema;
      const type = Object.entries(SCHEMA).find(([, value]) => {
        return value === _schema;
      })?.[0] ?? "Unknown";
      switch (container) {
        case SCHEMA.MAP_MODIFIER:
          return `${type}Map`;
        case SCHEMA.LIST_MODIFIER:
          return `${type}List`;
        case 0:
          return type;
      }
    }
    return "Unknown";
  }
};
NormalizedSchema.symbol = Symbol.for("@smithy/core/schema::NormalizedSchema");

export {
  getHttpHandlerExtensionConfiguration,
  resolveHttpHandlerRuntimeConfig,
  EndpointURLScheme,
  AlgorithmId,
  SMITHY_CONTEXT_KEY,
  HttpRequest,
  HttpResponse,
  isValidHostname,
  getSmithyContext,
  normalizeProvider,
  fromUtf8,
  toUint8Array,
  toUtf8,
  SCHEMA,
  NormalizedSchema
};
//# sourceMappingURL=chunk-4RTY6RNN.js.map
