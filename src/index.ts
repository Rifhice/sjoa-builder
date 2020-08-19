#!/usr/bin/env node
import { OpenApiBuilder, OpenAPIObject, PathsObject } from "openapi3-ts";
const glob = require("glob");
const path = require("path");
global.require = require;
export const isAnObject = (value: any) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getFilesFromPath = (path: string): Promise<string[]> => {
  return new Promise((resolve) =>
    glob(path, async function (err, res: string[]) {
      if (err) return resolve([]);
      resolve(res);
    })
  );
};

export const getFilesFromPaths = async (
  pathRegexes: string[]
): Promise<string[]> => {
  try {
    if (
      !Array.isArray(pathRegexes) ||
      !pathRegexes.every((path) => typeof path === "string")
    )
      return [];
    const filesPromises = pathRegexes.map<Promise<string[]>>((path) =>
      getFilesFromPath(path)
    );
    return (await Promise.all(filesPromises)).flat();
  } catch (error) {
    return [];
  }
};

export const getExportedMembersFromFile = (filePath: string) => {
  try {
    if (!filePath || !filePath.endsWith(".js")) return false;
    const requiredFile = global.require(path.join(process.cwd(), filePath));
    return requiredFile;
  } catch (error) {
    return false;
  }
};

export function getFromFile<T>(
  fileContent: any,
  variableName: string
): false | T {
  if (!fileContent || !variableName || !isAnObject(fileContent)) return false;
  return fileContent[variableName] ?? false;
}

export const formatBaseStructure = (
  baseStructure: OpenAPIObject
): OpenAPIObject => {
  const copy = JSON.parse(JSON.stringify(baseStructure));
  const defaultTitle = "app";
  const defaultVersion = "1.0.0";
  const defaultPaths = {};
  copy.openapi = "3.0.0";
  if (!copy.info)
    copy.info = {
      title: defaultTitle,
      version: defaultVersion,
    };
  if (!copy.info.title) copy.info.title = defaultTitle;
  if (!copy.info.version) copy.info.version = defaultVersion;
  if (!copy.paths) copy.paths = defaultPaths;
  copy.components = { schemas: {} };
  return copy;
};

export type RouteOptions = {
  globs: string[];
  variableName?: string;
  converter?: (rawData: any) => PathsObject;
};

export type SchemasOptions = {
  globs: string[];
  variableName?: string;
  converter?: (rawData: any) => PathsObject;
};

export const validateRoutesOptions = (options: RouteOptions) => {
  if (!isAnObject(options)) throw new Error("Routes should be an object");
  if (
    !options.globs ||
    !Array.isArray(options.globs) ||
    !options.globs.every((glob) => typeof glob === "string")
  )
    throw new Error("Routes glob should be an array of strings");
  if (options.converter && typeof options.converter !== "function")
    throw new Error("Routes converter should be a function");
  if (options.variableName && typeof options.variableName !== "string")
    throw new Error("Routes variable name should be a string");
};

export const validateSchemasOptions = (options: SchemasOptions) => {
  if (!isAnObject(options)) throw new Error("Schemas should be an object");
  if (
    !options.globs ||
    !Array.isArray(options.globs) ||
    !options.globs.every((glob) => typeof glob === "string")
  )
    throw new Error("Schemas glob should be an array of strings");
  if (options.converter && typeof options.converter !== "function")
    throw new Error("Schemas converter should be a function");
  if (options.variableName && typeof options.variableName !== "string")
    throw new Error("Schemas variable name should be a string");
};

export const extractPathsFromRouteFiles = async (options: RouteOptions) => {
  const { globs, variableName, converter } = options;
  const routesPaths = await getFilesFromPaths(globs);
  return routesPaths.reduce((acc, routePath) => {
    const fileContent = getExportedMembersFromFile(routePath);

    let routeDoc = getFromFile(fileContent, variableName || "route");
    if (!routeDoc) return acc;

    if (typeof converter === "function") routeDoc = converter(routeDoc);

    acc.push(Object.entries(routeDoc)[0]);
    return acc;
  }, []);
};

export const extractSchemaFromSchemaFiles = async (options: SchemasOptions) => {
  const { globs, variableName, converter } = options;
  const schemaPaths = await getFilesFromPaths(globs);
  return schemaPaths.reduce((acc, schemaPath) => {
    const fileContent = getExportedMembersFromFile(schemaPath);

    let routeDoc = getFromFile(fileContent, variableName || "schema");
    if (!routeDoc) return acc;

    if (typeof converter === "function") routeDoc = converter(routeDoc);

    acc.push(Object.entries(routeDoc)[0]);
    return acc;
  }, []);
};

export const build = async (options: {
  baseStructure: OpenAPIObject;
  routes: RouteOptions;
  schemas: SchemasOptions;
}): Promise<OpenAPIObject> => {
  if (!isAnObject(options)) throw new Error("Options should be an object");

  const { routes, schemas } = options;

  if (!isAnObject(options.baseStructure))
    throw new Error("Base structure should be an object");
  const baseStructure = formatBaseStructure(options.baseStructure);

  validateRoutesOptions(routes);
  validateSchemasOptions(schemas);

  const doc = new OpenApiBuilder(baseStructure);

  // Add paths to documentation
  (await extractPathsFromRouteFiles(routes)).forEach(([path, route]) =>
    doc.addPath(path, { ...route })
  );

  // Add schema to documentation
  (await extractSchemaFromSchemaFiles(schemas)).forEach(([path, schema]) =>
    doc.addSchema(path, { ...schema })
  );

  return doc.getSpec();
};
