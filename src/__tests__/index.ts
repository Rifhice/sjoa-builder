import * as utils from "..";
const glob = require("glob");

jest.mock("glob");

describe("getFilesFromPath", () => {
  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  test("Should return a array of files", async (done) => {
    glob.mockImplementation((path, cb) => cb(undefined, ["lol"]));
    const files = await utils.getFilesFromPath("*");
    expect(files.every((file) => typeof file === "string")).toBe(true);
    expect(files).toEqual(["lol"]);
    done();
  });
  test("Should return an empty array on error", async (done) => {
    glob.mockImplementation((path, cb) => cb("error"));
    const files = await utils.getFilesFromPath("*");
    expect(files).toEqual([]);
    done();
  });
});

describe("getFilesFromPaths", () => {
  test("Should return an array of files", async (done) => {
    //@ts-ignore
    utils.getFilesFromPath = jest.fn().mockReturnValueOnce([]);
    expect(await utils.getFilesFromPaths([])).toEqual([]);
    //@ts-ignore
    utils.getFilesFromPath = jest.fn().mockReturnValueOnce(["lol"]);
    expect(await utils.getFilesFromPaths([])).toEqual([]);
    //@ts-ignore
    utils.getFilesFromPath = jest.fn().mockReturnValueOnce([]);
    expect(await utils.getFilesFromPaths(["*"])).toEqual([]);
    //@ts-ignore
    utils.getFilesFromPath = jest.fn().mockReturnValueOnce(["lol"]);
    expect(await utils.getFilesFromPaths(["*"])).toEqual(["lol"]);
    done();
  });
  test("Should return a flat array of files", async (done) => {
    //@ts-ignore
    utils.getFilesFromPath = jest
      .fn()
      .mockReturnValueOnce(["lol"])
      .mockReturnValueOnce(["slt"]);
    const files = await utils.getFilesFromPaths(["*", "**/*"]);
    expect(files).toEqual(["lol", "slt"]);
    done();
  });
  test("Should return an empty array on error", async (done) => {
    //@ts-ignore
    utils.getFilesFromPath = jest.fn().mockImplementation(() => {
      throw new Error("");
    });
    const files = await utils.getFilesFromPaths(["*", "**/*"]);
    expect(files).toEqual([]);
    done();
  });

  test("Should return an empty array with wrong parameters", async (done) => {
    //@ts-ignore
    expect(await utils.getFilesFromPaths()).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths([3])).toEqual([]);
    done();
  });
  test("Should return an empty array of files when no or invalid paths provided", async (done) => {
    expect(await utils.getFilesFromPaths([])).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths({})).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths()).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths(3)).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths("le")).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths(null)).toEqual([]);
    //@ts-ignore
    expect(await utils.getFilesFromPaths(false)).toEqual([]);
    done();
  });
});

describe("getExportedMembersFromFile", () => {
  test("Should return false if no path is specified", () => {
    //@ts-ignore
    const result = utils.getExportedMembersFromFile();
    expect(result).toEqual(false);
  });
  test("Should return false if file is not js", () => {
    //@ts-ignore
    global.require = () => ({ should: "not_work" });
    const result = utils.getExportedMembersFromFile("test/lol.txt");
    expect(result).toEqual(false);
  });
  test("Should return the exported members of a javascript file", () => {
    //@ts-ignore
    global.require = () => ({ should: "not_work" });
    const result = utils.getExportedMembersFromFile("test/lol.js");
    expect(result).toEqual({ should: "not_work" });
  });
  test("Should return false on error", () => {
    //@ts-ignore
    global.require = () => {
      throw new Error("");
    };
    const result = utils.getExportedMembersFromFile("test/lol.js");
    expect(result).toEqual(false);
  });
});

describe("getFromFile", () => {
  test("Should return false if either parameters is not specified", () => {
    //@ts-ignore
    expect(utils.getFromFile()).toEqual(false);
    //@ts-ignore
    expect(utils.getFromFile("test")).toEqual(false);
    expect(utils.getFromFile(undefined, "test")).toEqual(false);
  });
  test("Should return the content of the key variableName from the first parameter", () => {
    const result = utils.getFromFile({ salut: "lol" }, "salut");
    expect(result).toEqual("lol");
  });
  test("Should return false if the variable doesn't exist", () => {
    const result = utils.getFromFile({ salut: "lol" }, "mdr");
    expect(result).toEqual(false);
  });
  test("Should return the false if the first parameters is not an object", () => {
    expect(utils.getFromFile("kappa", "salut")).toEqual(false);
    expect(utils.getFromFile(null, "salut")).toEqual(false);
    expect(utils.getFromFile([], "salut")).toEqual(false);
    expect(utils.getFromFile(3, "salut")).toEqual(false);
    expect(utils.getFromFile(undefined, "salut")).toEqual(false);
  });
});

describe("formatBaseStructure", () => {
  test("Should not override values", () => {
    const validBaseStructure = {
      info: {
        title: "title",
        version: "version",
      },
      openapi: "3.0.0",
      paths: {},
    };
    expect(utils.formatBaseStructure(validBaseStructure)).toEqual(
      validBaseStructure
    );
  });
  test("Should override 'openapi'", () => {
    const validBaseStructure = {
      info: {
        title: "title",
        version: "version",
      },
      openapi: "2.0.0",
      paths: {},
    };
    expect(utils.formatBaseStructure(validBaseStructure)).toEqual({
      ...validBaseStructure,
      openapi: "3.0.0",
    });
  });
  test("Should set default values", () => {
    //@ts-ignore
    expect(utils.formatBaseStructure({})).toEqual({
      info: {
        title: "app",
        version: "1.0.0",
      },
      openapi: "3.0.0",
      paths: {},
    });
  });
  test("Should set default values", () => {
    const validBaseStructure = {
      info: {
        title: "title",
      },
      openapi: "2.0.0",
      paths: {},
    };
    //@ts-ignore
    expect(utils.formatBaseStructure(validBaseStructure)).toEqual({
      info: {
        title: "title",
        version: "1.0.0",
      },
      openapi: "3.0.0",
      paths: {},
    });
  });
});

describe("validateRoutesOptions", () => {
  test("Should throw if invalid parameters", () => {
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions(null)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions(5)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions("null")
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions([])
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({})
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions(undefined)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: "null" })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: {} })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: [undefined] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: [null] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: [5] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ globs: [{}] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: "null" })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: [] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: {} })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ converter: undefined })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ variableName: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ variableName: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ variableName: [] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ variableName: {} })
    ).toThrowError(Error);
    //@ts-ignore
    expect(() =>
      //@ts-ignore
      utils.validateRoutesOptions({ variableName: undefined })
    ).toThrowError(Error);
  });
});
describe("validateSchemasOptions", () => {
  test("Should throw if invalid parameters", () => {
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions(null)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions(5)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions("null")
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions([])
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({})
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions(undefined)
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: "null" })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: {} })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: [undefined] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: [null] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: [5] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ globs: [{}] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: "null" })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: [] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: {} })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ converter: undefined })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ variableName: null })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ variableName: 5 })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ variableName: [] })
    ).toThrowError(Error);
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ variableName: {} })
    ).toThrowError(Error);
    //@ts-ignore
    expect(() =>
      //@ts-ignore
      utils.validateSchemasOptions({ variableName: undefined })
    ).toThrowError(Error);
  });
});
describe("extractPathsFromRouteFiles", () => {
  test("Should return non converted route", async (done) => {
    //@ts-ignore
    utils.getFilesFromPaths = jest
      .fn()
      .mockResolvedValue(["my file", "my file 2"]);
    //@ts-ignore
    utils.getExportedMembersFromFile = jest.fn().mockReturnValue({
      route: {
        salut: { hey: "mdr" },
      },
    });
    const paths = await utils.extractPathsFromRouteFiles({
      globs: [],
    });
    expect(paths).toEqual([
      ["salut", { hey: "mdr" }],
      ["salut", { hey: "mdr" }],
    ]);
    done();
  });
  test("Should return converted route", async (done) => {
    //@ts-ignore
    utils.getFilesFromPaths = jest
      .fn()
      .mockResolvedValue(["my file", "my file 2"]);
    //@ts-ignore
    utils.getExportedMembersFromFile = jest.fn().mockReturnValue({
      route: {
        salut: { hey: "mdr" },
      },
    });
    const paths = await utils.extractPathsFromRouteFiles({
      globs: [],
      //@ts-ignore
      converter: (value) => ({ mdr: "lol" }),
    });
    expect(paths).toEqual([
      ["mdr", "lol"],
      ["mdr", "lol"],
    ]);
    done();
  });
});

describe("extractPathsFromRouteFiles", () => {
  test("Should return non converted route", async (done) => {
    //@ts-ignore
    utils.getFilesFromPaths = jest
      .fn()
      .mockResolvedValue(["my file", "my file 2"]);
    //@ts-ignore
    utils.getExportedMembersFromFile = jest.fn().mockReturnValue({
      route: {
        salut: { hey: "mdr" },
      },
    });
    const paths = await utils.extractPathsFromRouteFiles({
      globs: [],
    });
    expect(paths).toEqual([
      ["salut", { hey: "mdr" }],
      ["salut", { hey: "mdr" }],
    ]);
    done();
  });
  test("Should return converted route", async (done) => {
    //@ts-ignore
    utils.getFilesFromPaths = jest
      .fn()
      .mockResolvedValue(["my file", "my file 2"]);
    //@ts-ignore
    utils.getExportedMembersFromFile = jest.fn().mockReturnValue({
      route: {
        salut: { hey: "mdr" },
      },
    });
    const paths = await utils.extractPathsFromRouteFiles({
      globs: [],
      //@ts-ignore
      converter: (value) => ({ mdr: "lol" }),
    });
    expect(paths).toEqual([
      ["mdr", "lol"],
      ["mdr", "lol"],
    ]);
    done();
  });
});

describe("build", () => {
  test("Should throw error if either arguments is omitted or is not an object", () => {
    //@ts-ignore
    expect(() => utils.build({})).rejects.toBeInstanceOf(Error);
    //@ts-ignore
    expect(() => utils.build(3)).rejects.toBeInstanceOf(Error);
    //@ts-ignore
    expect(() => utils.build("lol")).rejects.toBeInstanceOf(Error);
    //@ts-ignore
    expect(() => utils.build(null)).rejects.toBeInstanceOf(Error);
    //@ts-ignore
    expect(() => utils.build(false)).rejects.toBeInstanceOf(Error);
    //@ts-ignore
    expect(() => utils.build([])).rejects.toBeInstanceOf(Error);
  });
  test("Should throw error if base structure is invalid", (done) => {
    const options = {
      routes: {
        globs: [],
      },
      schemas: {
        globs: [],
      },
    };
    expect(() =>
      utils.build({ ...options, baseStructure: null })
    ).rejects.toBeInstanceOf(Error);
    expect(() =>
      //@ts-ignore
      utils.build({ ...options, baseStructure: 5 })
    ).rejects.toBeInstanceOf(Error);
    expect(() =>
      //@ts-ignore
      utils.build({ ...options, baseStructure: "null" })
    ).rejects.toBeInstanceOf(Error);
    expect(() =>
      //@ts-ignore
      utils.build({ ...options, baseStructure: [] })
    ).rejects.toBeInstanceOf(Error);
    expect(() =>
      utils.build({ ...options, baseStructure: undefined })
    ).rejects.toBeInstanceOf(Error);
    done();
  });
  test("Should call formatBaseStructure once", () => {
    const spy = jest.spyOn(utils, "formatBaseStructure");
    utils.build({
      //@ts-ignore
      baseStructure: {},
      routes: {
        globs: [],
      },
      schemas: {
        globs: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call validateRoutesOptions", () => {
    const spy = jest.spyOn(utils, "validateRoutesOptions");
    utils.build({
      //@ts-ignore
      baseStructure: {},
      routes: {
        globs: [],
      },
      schemas: {
        globs: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call validateSchemasOptions", () => {
    const spy = jest.spyOn(utils, "validateSchemasOptions");
    utils.build({
      //@ts-ignore
      baseStructure: {},
      routes: {
        globs: [],
      },
      schemas: {
        globs: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call extractPathsFromRouteFiles", () => {
    const spy = jest.spyOn(utils, "extractPathsFromRouteFiles");
    utils.build({
      //@ts-ignore
      baseStructure: {},
      routes: {
        globs: ["*/*"],
      },
      schemas: {
        globs: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("Should add paths to doc", async (done) => {
    //@ts-ignore
    utils.extractPathsFromRouteFiles = jest
      .fn()
      .mockResolvedValueOnce([["lol", { great: "post" }]]);
    const result = await utils.build({
      //@ts-ignore
      baseStructure: {},
      routes: {
        globs: ["*/*"],
      },
      schemas: {
        globs: [],
      },
    });
    expect(result.paths).toEqual({
      lol: { great: "post" },
    });
    done();
  });
});
