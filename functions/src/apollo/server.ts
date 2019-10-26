import { typeDefs } from "./schemas/baseSchema";
import { ApolloServer } from "apollo-server-express";
import { Resolvers, ProductionLineResponse, Role } from "./generated/types";
import { AuthDirective } from "./directives/authDirective";
import * as express from "express";
import { merge } from "lodash";
import { User } from "../utilities/user";
import { getDataSources, Database } from "../dataSources/getDataSources";
import { ProductRecipeDataSource } from "../dataSources/productRecipeDataSource";
import { productionLinePlannerResolver } from "./resolvers/productionLinePlannerResolver";

const baseResolver: Resolvers = {
    Query: {
        hello: () => Promise.resolve("Hello!")
    }
};

const resolvers: Resolvers = merge(baseResolver, productionLinePlannerResolver);

export async function generateApolloServer() {
    const app = express();

    const { productRecipeDataSource, userDataSource } = await getDataSources(
        Database.FIRESTORE
    );

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        schemaDirectives: { auth: AuthDirective },
        context: async ({ req }): Promise<ApolloServerContext> => {
            return {
                user: req.headers.authToken
                    ? await userDataSource.getUser(req.headers.authToken)
                    : null,
                recipeDataSource: productRecipeDataSource
            };
        }
    });

    server.applyMiddleware({ app, path: "/", cors: true });
    return app;
}

export interface ApolloServerContext {
    user: User;
    recipeDataSource: ProductRecipeDataSource;
}
