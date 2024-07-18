/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import type { FC } from 'react';
import React, { useState } from 'react';

import type { KibanaFeature } from '@kbn/features-plugin/common';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { useViewSpaceServices } from './hooks/view_space_context_provider';
import type { Space } from '../../../common';
import { FeatureTable } from '../edit_space/enabled_features/feature_table';
import { SectionPanel } from '../edit_space/section_panel';
import { SolutionView } from '../edit_space/solution_view';

interface Props {
  space: Space;
  features: KibanaFeature[];
  isSolutionNavEnabled: boolean;
}

export const ViewSpaceEnabledFeatures: FC<Props> = ({ features, space, isSolutionNavEnabled }) => {
  const { capabilities, getUrlForApp } = useViewSpaceServices();

  const [spaceNavigation, setSpaceNavigation] = useState<Partial<Space>>(space); // space details as seen in the Solution View UI, possibly with unsaved changes
  const [spaceFeatures, setSpaceFeatures] = useState<Partial<Space>>(space); // space details as seen in the Feature Visibility UI, possibly with unsaved changes
  const [isDirty, setIsDirty] = useState(false); // track if unsaved changes have been made

  if (!features) {
    return null;
  }

  const canManageRoles = capabilities.management?.security?.roles === true;

  const onChangeSpaceNavigation = (updatedSpace: Partial<Space>) => {
    setIsDirty(true);
    setSpaceNavigation(updatedSpace);
    console.log('updatedSpace-solutionView', updatedSpace);
  };

  const onChangeSpaceFeatures = (updatedSpace: Partial<Space>) => {
    setIsDirty(true);
    setSpaceFeatures({ ...updatedSpace, id: space.id });
    console.log('updatedSpace-featuresTable', updatedSpace);
  };

  const onUpdateSpace = () => {
    window.alert('not yet implemented');
  };

  const onCancel = () => {
    setSpaceNavigation(space);
    setSpaceFeatures(space);
    setIsDirty(false);
  };

  return (
    <>
      {isSolutionNavEnabled && (
        <>
          <SolutionView space={spaceNavigation} onChange={onChangeSpaceNavigation} />
          <EuiSpacer />
        </>
      )}

      <SectionPanel
        title={i18n.translate('xpack.spaces.management.manageSpacePage.featuresTitle', {
          defaultMessage: 'Features',
        })}
        data-test-subj="enabled-features-panel"
      >
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="xs">
              <h3>
                <FormattedMessage
                  id="xpack.spaces.management.viewSpaceFeatures.enableFeaturesInSpaceMessage"
                  defaultMessage="Feature visibility"
                />
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiText size="s" color="subdued">
              <p>
                <FormattedMessage
                  id="xpack.spaces.management.viewSpaceFeatures.notASecurityMechanismMessage"
                  defaultMessage="Hidden features are removed from the user interface, but not disabled. To secure access to features, {manageRolesLink}."
                  values={{
                    manageRolesLink: canManageRoles ? (
                      <EuiLink href={getUrlForApp('management', { path: '/security/roles' })}>
                        <FormattedMessage
                          id="xpack.spaces.management.viewSpaceFeatures.manageRolesLinkText"
                          defaultMessage="manage security roles"
                        />
                      </EuiLink>
                    ) : (
                      <FormattedMessage
                        id="xpack.spaces.management.viewSpaceFeatures.manageRolesLinkText"
                        defaultMessage="manage security roles"
                      />
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <FeatureTable
              features={features}
              space={spaceFeatures}
              onChange={onChangeSpaceFeatures}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </SectionPanel>

      {isDirty && (
        <>
          <EuiSpacer />
          <p>
            <EuiText>
              Changes will impact all users in the Space. The page will be reloaded.
            </EuiText>
          </p>
          <p>
            <EuiButton color="primary" fill onClick={onUpdateSpace}>
              Update Space
            </EuiButton>
            <EuiButtonEmpty onClick={onCancel}>Cancel</EuiButtonEmpty>
          </p>
        </>
      )}
    </>
  );
};
