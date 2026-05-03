import {
  createResource,
  deleteResource,
  addStock,
  getAnalytics,
  getSummary,
  listResources,
  updateResource
} from "../services/resourceService.js";

function validatePayload(resource, payload) {
  if (!payload.date) {
    return "A data e obrigatoria.";
  }

  if (resource === "expenses" && (!payload.type || !payload.amount)) {
    return "Tipo e valor sao obrigatorios.";
  }

  if (resource === "sales" && (!payload.quantity || !payload.price)) {
    return "Quantidade e preco sao obrigatorios.";
  }

  if (resource === "losses" && (!payload.quantity || !payload.reason)) {
    return "Quantidade e motivo sao obrigatorios.";
  }

  return null;
}

export function buildResourceController(resource) {
  return {
    list: async (request, response, next) => {
      try {
        const data = await listResources(resource, request.query, request.user.id);
        response.json(data);
      } catch (error) {
        next(error);
      }
    },
    create: async (request, response, next) => {
      try {
        const message = validatePayload(resource, request.body);
        if (message) {
          return response.status(400).json({ message });
        }
        const id = await createResource(resource, request.body, request.user.id);
        response.status(201).json({ id, message: "Registro criado com sucesso." });
      } catch (error) {
        next(error);
      }
    },
    update: async (request, response, next) => {
      try {
        const message = validatePayload(resource, request.body);
        if (message) {
          return response.status(400).json({ message });
        }
        await updateResource(resource, request.params.id, request.body, request.user.id);
        response.json({ message: "Registro atualizado com sucesso." });
      } catch (error) {
        next(error);
      }
    },
    remove: async (request, response, next) => {
      try {
        await deleteResource(resource, request.params.id, request.user.id);
        response.json({ message: "Registro removido com sucesso." });
      } catch (error) {
        next(error);
      }
    }
  };
}

export async function summaryController(request, response, next) {
  try {
    const data = await getSummary(request.query, request.user.id);
    response.json(data);
  } catch (error) {
    next(error);
  }
}

export async function analyticsController(request, response, next) {
  try {
    const data = await getAnalytics(request.user.id, request.query);
    response.json(data);
  } catch (error) {
    next(error);
  }
}

export async function addStockController(request, response, next) {
  try {
    const data = await addStock(request.user.id, request.body.quantity);
    response.status(201).json({ ...data, message: "Estoque atualizado com sucesso." });
  } catch (error) {
    next(error);
  }
}
