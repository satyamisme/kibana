/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpStart } from '@kbn/core/public';
import type { BulkUpdateRoleResponse } from '@kbn/security-plugin-types-public/src/roles/roles_api_client';

import type { Role, RoleIndexPrivilege, RoleRemoteIndexPrivilege } from '../../../common';
import { copyRole } from '../../../common/model';

export class RolesAPIClient {
  constructor(private readonly http: HttpStart) {}

  public getRoles = async () => {
    return await this.http.get<Role[]>('/api/security/role');
  };

  public getRole = async (roleName: string) => {
    return await this.http.get<Role>(`/api/security/role/${encodeURIComponent(roleName)}`);
  };

  public deleteRole = async (roleName: string) => {
    await this.http.delete(`/api/security/role/${encodeURIComponent(roleName)}`);
  };

  public saveRole = async ({ role, createOnly = false }: { role: Role; createOnly?: boolean }) => {
    await this.http.put(`/api/security/role/${encodeURIComponent(role.name)}`, {
      body: JSON.stringify(this.transformRoleForSave(copyRole(role))),
      query: { createOnly },
    });
  };

  public bulkUpdateRoles = async ({
    rolesUpdate,
  }: {
    rolesUpdate: Role[];
  }): Promise<BulkUpdateRoleResponse> => {
    return await this.http.post('/api/security/roles', {
      body: JSON.stringify({
        roles: Object.fromEntries(
          rolesUpdate.map((role) => [role.name, this.transformRoleForSave(copyRole(role))])
        ),
      }),
    });
  };

  private transformRoleForSave = (role: Role) => {
    // Remove any placeholder index privileges
    const isPlaceholderPrivilege = (
      indexPrivilege: RoleIndexPrivilege | RoleRemoteIndexPrivilege
    ) => {
      if (
        'clusters' in indexPrivilege &&
        indexPrivilege.clusters &&
        indexPrivilege.clusters.length > 0
      ) {
        return false;
      }
      return indexPrivilege.names.length === 0 && indexPrivilege.privileges.length === 0;
    };
    role.elasticsearch.indices = role.elasticsearch.indices.filter(
      (indexPrivilege) => !isPlaceholderPrivilege(indexPrivilege)
    );
    role.elasticsearch.remote_indices = role.elasticsearch.remote_indices?.filter(
      (indexPrivilege) => !isPlaceholderPrivilege(indexPrivilege)
    );

    // Remove any placeholder query entries
    role.elasticsearch.indices.forEach((index) => index.query || delete index.query);
    role.elasticsearch.remote_indices?.forEach((index) => index.query || delete index.query);

    role.kibana.forEach((kibanaPrivilege) => {
      // If a base privilege is defined, then do not persist feature privileges
      if (kibanaPrivilege.base.length > 0) {
        kibanaPrivilege.feature = {};
      }
    });

    // @ts-expect-error
    delete role.name;
    delete role.transient_metadata;
    delete role._unrecognized_applications;
    delete role._transform_error;

    return role;
  };
}
