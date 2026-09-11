// Erreur applicative : message SAFE à renvoyer tel quel au client.
// Ne jamais laisser une erreur technique (SQL, stack trace) remonter au client
// (section 45 du cahier des charges : gestion des erreurs).
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  }
  static unauthorized(message = "Authentification requise.", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }
  static forbidden(message = "Accès refusé.", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }
  static notFound(message = "Ressource introuvable.", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }
  static conflict(message: string, code = "CONFLICT") {
    return new AppError(409, code, message);
  }
  static tooMany(message = "Trop de tentatives, réessayez plus tard.", code = "RATE_LIMITED") {
    return new AppError(429, code, message);
  }
}
