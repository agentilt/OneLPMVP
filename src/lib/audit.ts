import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  GRANT_ACCESS = 'GRANT_ACCESS',
  REVOKE_ACCESS = 'REVOKE_ACCESS',
  VIEW = 'VIEW',
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  SORT = 'SORT',
  EXPORT_DATA = 'EXPORT_DATA',
  PRINT = 'PRINT',
  SHARE = 'SHARE',
  COPY = 'COPY',
  NAVIGATE = 'NAVIGATE',
  FORM_SUBMIT = 'FORM_SUBMIT',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  EMAIL_PREFERENCE_UPDATE = 'EMAIL_PREFERENCE_UPDATE'
}

export enum AuditResource {
  USER = 'USER',
  FUND = 'FUND',
  DOCUMENT = 'DOCUMENT',
  DIRECT_INVESTMENT = 'DIRECT_INVESTMENT',
  DIRECT_INVESTMENT_DOCUMENT = 'DIRECT_INVESTMENT_DOCUMENT',
  FUND_ACCESS = 'FUND_ACCESS',
  INVITATION = 'INVITATION',
  SYSTEM = 'SYSTEM',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
  AUDIT_LOG = 'AUDIT_LOG',
  ANALYTICS = 'ANALYTICS',
  PAGE = 'PAGE'
}

export interface AuditLogData {
  userId: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  description: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  static async log(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
          data: {
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId,
            description: data.description,
            oldValues: data.oldValues || undefined,
            newValues: data.newValues || undefined,
            metadata: data.metadata || undefined,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
          }
        })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async logUserUpdate(
    adminUserId: string,
    targetUserId: string,
    oldValues: any,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      resource: AuditResource.USER,
      resourceId: targetUserId,
      description: `Updated user profile`,
      oldValues,
      newValues,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logFundUpdate(
    adminUserId: string,
    fundId: string,
    oldValues: any,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: AuditAction.UPDATE,
      resource: AuditResource.FUND,
      resourceId: fundId,
      description: `Updated fund details`,
      oldValues,
      newValues,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logDocumentUpload(
    userId: string,
    documentId: string,
    fundId: string,
    documentType: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.UPLOAD,
      resource: AuditResource.DOCUMENT,
      resourceId: documentId,
      description: `Uploaded ${documentType} document`,
      newValues: { fundId, documentType },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logLogin(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGIN,
      resource: AuditResource.SYSTEM,
      description: 'User logged in',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logLogout(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGOUT,
      resource: AuditResource.SYSTEM,
      description: 'User logged out',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logPasswordReset(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.RESET_PASSWORD,
      resource: AuditResource.SYSTEM,
      description: 'Password reset requested',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logAccessGrant(
    adminUserId: string,
    targetUserId: string,
    fundId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: AuditAction.GRANT_ACCESS,
      resource: AuditResource.FUND_ACCESS,
      resourceId: fundId,
      description: `Granted access to fund for user ${targetUserId}`,
      newValues: { targetUserId, fundId },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logAccessRevoke(
    adminUserId: string,
    targetUserId: string,
    fundId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: AuditAction.REVOKE_ACCESS,
      resource: AuditResource.FUND_ACCESS,
      resourceId: fundId,
      description: `Revoked access to fund for user ${targetUserId}`,
      newValues: { targetUserId, fundId },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logView(
    userId: string,
    resource: AuditResource,
    resourceId: string,
    request?: NextRequest,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.VIEW,
      resource,
      resourceId,
      description: `Viewed ${resource.toLowerCase()}`,
      metadata,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logSearch(
    userId: string,
    query: string,
    resource: AuditResource,
    request?: NextRequest,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.SEARCH,
      resource,
      description: `Searched for: ${query}`,
      metadata: { query, ...metadata },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logFilter(
    userId: string,
    resource: AuditResource,
    filterType: string,
    filterValue: any,
    request?: NextRequest,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.FILTER,
      resource,
      description: `Applied filter: ${filterType}`,
      metadata: { filterType, filterValue, ...metadata },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logExport(
    userId: string,
    resource: AuditResource,
    exportType: string,
    request?: NextRequest,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.EXPORT_DATA,
      resource,
      description: `Exported ${exportType}`,
      metadata: { exportType, ...metadata },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logSettingsUpdate(
    userId: string,
    settingType: string,
    oldValues: any,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.SETTINGS_UPDATE,
      resource: AuditResource.SETTINGS,
      description: `Updated ${settingType} settings`,
      oldValues,
      newValues,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  static async logEmailPreferenceUpdate(
    userId: string,
    oldValues: any,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.EMAIL_PREFERENCE_UPDATE,
      resource: AuditResource.SETTINGS,
      description: 'Updated email preferences',
      oldValues,
      newValues,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined
    })
  }

  private static getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined
    
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return undefined
  }
}

// Helper function to get changes between old and new objects
export function getObjectChanges(oldObj: any, newObj: any): { oldValues: any, newValues: any } {
  const changes: any = {}
  const oldValues: any = {}
  const newValues: any = {}
  
  for (const key in newObj) {
    if (oldObj[key] !== newObj[key]) {
      oldValues[key] = oldObj[key]
      newValues[key] = newObj[key]
    }
  }
  
  return { oldValues, newValues }
}
