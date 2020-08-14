#!/usr/bin/env node
import {
  OpenApiBuilder,
  OpenAPIObject,
  PathsObject,
  ReferenceObject,
  SchemaObject,
} from "openapi3-ts";
const glob = require("glob");
const path = require("path");

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
    const files = (
      await Promise.all(
        pathRegexes.map<Promise<string[]>>((path) => getFilesFromPath(path))
      )
    ).flat();
    return files;
  } catch (error) {
    return [];
  }
};

export const getFileContent = (filePath: string) => {
  try {
    const requiredFile = require(path.join(process.cwd(), filePath));
    return requiredFile;
  } catch (error) {
    return false;
  }
};

export function getFromFile<T>(
  fileContent: any,
  variableName: string
): false | T {
  if (!fileContent || !variableName) return false;
  if (fileContent[variableName]) return fileContent[variableName];
  return false;
}

export const merge = async ({
  baseStructure,
  routes,
  schemas,
}: {
  baseStructure: OpenAPIObject & { openapi: "3.0.0" };
  routes: {
    globs: string[];
    variableName?: string;
    converter?: (rawData: any) => PathsObject;
  };
  schemas: {
    globs: string[];
    variableName?: string;
    converter?: (rawData: any) => SchemaObject | ReferenceObject;
  };
}): Promise<OpenAPIObject> => {
  const doc = new OpenApiBuilder(baseStructure);

  // Add paths to documentation
  const routesPaths = await getFilesFromPaths(routes.globs);
  for (const routePath of routesPaths) {
    const fileContent = getFileContent(routePath);
    let routeDoc = getFromFile(fileContent, routes.variableName || "route");
    if (!routeDoc) continue;

    if (typeof routes.converter === "function")
      routeDoc = routes.converter(routeDoc);

    const [path, route] = Object.entries(routeDoc)[0];

    doc.addPath(path, route);
  }

  // Add schemas to documentation
  const schemasPaths = await getFilesFromPaths(schemas.globs);
  for (const schemaPath of schemasPaths) {
    const fileContent = getFileContent(schemaPath);
    let schemaDoc = getFromFile(fileContent, schemas.variableName || "schema");
    if (!schemaDoc) continue;

    if (typeof schemas.converter === "function")
      schemaDoc = schemas.converter(schemaDoc);

    const [path, schema] = Object.entries(schemaDoc)[0];

    doc.addSchema(path, schema);
  }

  return doc.getSpec();
};
