import {
  blockProducer,
  createAdmin,
  deleteProducer,
  getAdminDashboard,
  getAdminReports,
  listProducers
} from "../services/adminService.js";

export async function dashboard(request, response, next) {
  try {
    response.json(await getAdminDashboard());
  } catch (error) {
    next(error);
  }
}

export async function producers(request, response, next) {
  try {
    response.json(await listProducers());
  } catch (error) {
    next(error);
  }
}

export async function reports(request, response, next) {
  try {
    response.json(await getAdminReports());
  } catch (error) {
    next(error);
  }
}

export async function blockUser(request, response, next) {
  try {
    await blockProducer(request.params.id);
    response.json({ message: "Conta bloqueada com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function removeUser(request, response, next) {
  try {
    await deleteProducer(request.params.id);
    response.json({ message: "Conta excluida com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function registerAdmin(request, response, next) {
  try {
    const result = await createAdmin(request.body);
    response.status(201).json({ ...result, message: "Administrador cadastrado com sucesso." });
  } catch (error) {
    next(error);
  }
}
