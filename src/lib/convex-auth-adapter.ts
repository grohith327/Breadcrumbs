// This file is no longer used after migrating from Better Auth to custom auth system
// Keeping for reference only - can be removed in the future

interface CreateParams {
  model: string;
  data: Record<string, unknown>;
}

interface FindParams {
  model: string;
  where: Record<string, unknown>;
}

interface UpdateParams {
  model: string;
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface CreateManyParams {
  model: string;
  data: Record<string, unknown>[];
}

// Legacy Convex adapter - no longer used
export function createConvexAdapter() {
  return {
    id: "convex",

    async init() {
      return;
    },

    async create({ model }: CreateParams) {
      throw new Error(`Legacy adapter: Model ${model} not supported`);
    },

    async findFirst({ model }: FindParams) {
      console.warn(`Legacy adapter: findFirst not implemented for model ${model}`);
      return null;
    },

    async findMany({ model }: { model: string }) {
      console.warn(`Legacy adapter: findMany not implemented for model ${model}`);
      return [];
    },

    async update({ model }: UpdateParams) {
      throw new Error(`Legacy adapter: Update for model ${model} not supported`);
    },

    async delete({ model }: FindParams) {
      throw new Error(`Legacy adapter: Delete for model ${model} not supported`);
    },

    async createMany({ model }: CreateManyParams) {
      throw new Error(`Legacy adapter: createMany for model ${model} not supported`);
    },
  };
}