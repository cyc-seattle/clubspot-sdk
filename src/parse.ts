/**
 * Typescript Wrappers around the Parse Javascript SDK.
 * @see https://parseplatform.org/Parse-SDK-JS/api/7.1.2/
 */
import type * as ParseTypes from "parse";
// parse ships declarations only for its browser entry. The Node build has the same API, so it takes those types.
// @ts-expect-error -- parse/node.js has no declaration file
import ParseNode from "parse/node.js";
import winston from "winston";

// parse is CommonJS, so its default export sits one level further down.
export const Parse: typeof ParseTypes.default.default = ParseNode;

// Matches the Attributes type parse uses for Parse.Object, which it doesn't export from its entry point.
type Attributes = Record<string, any>;

/** The instance types of the classes on Parse, so `Parse.User` and the rest also work as types. */
// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace Parse {
  type Object<T extends Attributes = Attributes> = ParseTypes.Object<T>;
  type User<T extends Attributes = Attributes> = ParseTypes.User<T>;
  type Query<T extends ParseTypes.Object = ParseTypes.Object> = ParseTypes.Query<T>;
}

type QueryOptions = Parameters<ParseTypes.Query["find"]>[0];

/** The base of the SDK's Clubspot classes. */
export class ClubspotObject<T extends Attributes = Attributes> extends Parse.Object<T> {
  // parse makes id optional, since an unsaved object has none. Consumers read these objects from Clubspot,
  // where every object has one. `declare` changes only the type, so the field isn't redefined at run time.
  declare id: string;
}

export type ObjectConstructor<T> = { new (options?: any): T };

interface Schema<T> {
  objectClass: string;
  className: string;
  clazz: ObjectConstructor<T>;
}

/**
 * A list of all Parse classes that have been registered.
 */
export const schemas: Schema<any>[] = [];

/**
 * Registers subclasses of Parse.Object with Parse, under each class's static objectClass.
 */
export function register(...classes: (ObjectConstructor<Parse.Object> & { objectClass: string })[]): void {
  for (const clazz of classes) {
    schemas.push({ objectClass: clazz.objectClass, className: clazz.name, clazz });
    Parse.Object.registerSubclass(clazz.objectClass, clazz);
  }
}

/**
 * A simple wrapper around query that logs to winston before any finalizer method is called.
 */
export class LoggedQuery<T extends Parse.Object> extends Parse.Query<T> {
  override find(options?: QueryOptions): Promise<T[]> {
    winston.debug("Executing Query:find", {
      className: this.className,
      query: this.toJSON(),
      options,
    });
    return super.find(options);
  }

  override get(objectId: string, options?: QueryOptions): Promise<T> {
    winston.debug("Executing Query:get", {
      className: this.className,
      objectId,
      options,
    });
    return super.get(objectId, options);
  }
}
