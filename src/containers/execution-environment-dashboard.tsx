import { t } from '@lingui/core/macro';
import {
  Button,
  Checkbox,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import { useEffect, useState } from 'react';
import { sum } from 'lodash';
import {
  ExecutionEnvironmentAPI,
  ExecutionEnvironmentRegistryAPI,
} from 'src/api';
import {
  AlertList,
  type AlertType,
  BaseHeader,
  LoadingSpinner,
  ListItemActions,
  Main,
  DeleteModal,
  TagLabel,
} from 'src/components';

interface DashboardImage {
  repository: string;
  digest: string;
  tags: string[];
  size: number;
  created_at: string;
  isManifestList: boolean;
}

const ContainerDashboard = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<DashboardImage[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<DashboardImage | null>(
    null,
  );
  const [deleteTag, setDeleteTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeletionPending, setIsDeletionPending] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setAlerts([]);

      const repoResponse = await ExecutionEnvironmentAPI.list({ page_size: 100 });
      const repos = repoResponse.data.data || [];

      const imageEntries = await Promise.all(
        repos.map(async (repo) => {
          try {
            const result = await ExecutionEnvironmentAPI.images(repo.name, {
              page_size: 100,
            });
            return result.data.data.map((image) => ({
              repository: repo.name,
              digest: image.digest,
              tags: image.tags || [],
              size: sum((image.layers || []).map((layer) => layer.size || 0)),
              created_at: image.created_at,
              isManifestList: !!image.media_type?.match('manifest.list'),
            }));
          } catch {
            return [];
          }
        }),
      );

      setImages(imageEntries.flat());
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : String(error);
      setAlerts([
        {
          variant: 'danger',
          title: t`Failed to load Docker image dashboard`,
          description: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (image: DashboardImage) => {
    setSelectedImage(image);
    setDeleteTag(image.tags?.[0] ?? image.digest);
    setConfirmDelete(false);
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setSelectedImage(null);
    setDeleteTag('');
    setConfirmDelete(false);
  };

  const deleteImage = () => {
    if (!selectedImage) {
      return;
    }

    setIsDeletionPending(true);

    ExecutionEnvironmentAPI.deleteTag(
      selectedImage.repository,
      deleteTag || selectedImage.digest,
    )
      .then(() => {
        setAlerts([
          {
            variant: 'success',
            title: t`Deleted image tag ${deleteTag || selectedImage.digest}`,
          },
        ]);
        closeDeleteModal();
        loadDashboard();
      })
      .catch((err) => {
        const { status, statusText } = err.response || {};
        setAlerts([
          {
            variant: 'danger',
            title: t`Image tag could not be deleted`,
            description: status
              ? `${status} ${statusText}`
              : String(err),
          },
        ]);
        setIsDeletionPending(false);
      });
  };

  const closeAlert = (index: number) => {
    setAlerts((current) => current.filter((_, idx) => idx !== index));
  };

  return (
    <>
      <AlertList alerts={alerts} closeAlert={closeAlert} />
      <BaseHeader title={t`Docker image dashboard`} />
      <Main>
        {deleteModalVisible && selectedImage && (
          <DeleteModal
            title={t`Delete Docker image tag`}
            cancelAction={closeDeleteModal}
            deleteAction={deleteImage}
            isDisabled={!confirmDelete || isDeletionPending}
            spinner={isDeletionPending}
          >
            <TextContent>
              <Text component={TextVariants.p}>
                {t`Delete a specific image tag from repository ${selectedImage.repository}.`}
              </Text>
            </TextContent>
            {selectedImage.tags?.length ? (
              <FormGroup label={t`Tag to delete`} fieldId='delete-tag'>
                <Text component={TextVariants.small}>
                  {t`Select the exact tag that should be removed.`}
                </Text>
                <FormSelect
                  value={deleteTag}
                  onChange={(event) =>
                    setDeleteTag((event.target as HTMLSelectElement).value)
                  }
                  id='delete-tag'
                >
                  {selectedImage.tags.map((tag) => (
                    <FormSelectOption
                      key={tag}
                      label={tag}
                      value={tag}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            ) : null}
            <Checkbox
              id='delete_image_confirm'
              label={t`I understand that this action cannot be undone.`}
              isChecked={confirmDelete}
              onChange={(_event, value) => setConfirmDelete(value)}
            />
          </DeleteModal>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : images.length === 0 ? (
          <Text component={TextVariants.p}>
            {t`No Docker images found in Pulp container repositories.`}
          </Text>
        ) : (
          <section className='pulp-section'>
            <Table aria-label={t`Docker image dashboard`}>
              <thead>
                <tr>
                  <th>{t`Repository`}</th>
                  <th>{t`Digest`}</th>
                  <th>{t`Tags`}</th>
                  <th>{t`Size`}</th>
                  <th>{t`Published`}</th>
                  <th>{t`Actions`}</th>
                </tr>
              </thead>
              <Tbody>
                {images.map((image, index) => (
                  <Tr key={`${image.repository}-${image.digest}-${index}`}>
                    <Td>{image.repository}</Td>
                    <Td>{image.digest}</Td>
                    <Td>
                      {image.tags.length ? (
                        image.tags.map((tag) => (
                          <TagLabel key={tag} tag={tag} />
                        ))
                      ) : (
                        <span>{t`No tags`}</span>
                      )}
                    </Td>
                    <Td>{image.isManifestList ? '---' : `${image.size} bytes`}</Td>
                    <Td>{image.created_at}</Td>
                    <ListItemActions
                      buttons={[
                        <Button
                          key='delete-tag'
                          variant='danger'
                          onClick={() => openDeleteModal(image)}
                        >
                          {t`Delete tag`}
                        </Button>,
                      ]}
                    />
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </section>
        )}
      </Main>
    </>
  );
};

export default ContainerDashboard;
