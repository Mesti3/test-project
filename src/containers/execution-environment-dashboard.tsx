import { t } from '@lingui/core/macro';
import { Button, Card, CardBody, CardTitle, Gallery, GalleryItem, List, ListItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { ExecutionEnvironmentAPI, ExecutionEnvironmentRegistryAPI } from 'src/api';
import { AlertList, type AlertType, BaseHeader, LoadingSpinner, Main } from 'src/components';
import { Paths, formatPath } from 'src/paths';

interface ImageRepositoryCount {
  name: string;
  imageCount: number;
}

const ContainerDashboard = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [repositoryCount, setRepositoryCount] = useState<number>(0);
  const [registryCount, setRegistryCount] = useState<number>(0);
  const [imageCount, setImageCount] = useState<number>(0);
  const [topRepositories, setTopRepositories] = useState<ImageRepositoryCount[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [repoResponse, registryResponse] = await Promise.all([
          ExecutionEnvironmentAPI.list({ page_size: 100 }),
          ExecutionEnvironmentRegistryAPI.list({ page_size: 1 }),
        ]);

        const repos = repoResponse.data.data || [];
        setRepositoryCount(repoResponse.data.meta?.count ?? repos.length);
        setRegistryCount(registryResponse.data.meta?.count ?? 0);

        const imageCountPromises = repos.map(async (repo) => {
          try {
            const result = await ExecutionEnvironmentAPI.images(repo.name, {
              page_size: 1,
            });
            return {
              name: repo.name,
              imageCount: result.data.meta?.count ?? 0,
            };
          } catch {
            return { name: repo.name, imageCount: 0 };
          }
        });

        const repoCounts = await Promise.all(imageCountPromises);
        const totalImages = repoCounts.reduce(
          (sum, repo) => sum + repo.imageCount,
          0,
        );

        setImageCount(totalImages);
        setTopRepositories(
          repoCounts
            .sort((a, b) => b.imageCount - a.imageCount)
            .slice(0, 5),
        );
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

    loadDashboard();
  }, []);

  const closeAlert = (index: number) => {
    setAlerts((current) => current.filter((_, idx) => idx !== index));
  };

  return (
    <>
      <AlertList alerts={alerts} closeAlert={closeAlert} />
      <BaseHeader title={t`Docker images dashboard`} />
      <Main>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <section className='pulp-section'>
            <Gallery hasGutter>
              <GalleryItem>
                <Card>
                  <CardBody>
                    <CardTitle>{t`Total stored Docker images`}</CardTitle>
                    <Text component={TextVariants.p}>
                      {t`Pulp currently stores ${imageCount} Docker image manifests across your container repositories.`}
                    </Text>
                    <Link to={formatPath(Paths.container.repository.list)}>
                      <Button variant='primary'>{t`View container repositories`}</Button>
                    </Link>
                  </CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>
                    <CardTitle>{t`Container repositories`}</CardTitle>
                    <Text component={TextVariants.p}>
                      {t`There are ${repositoryCount} container repositories in Pulp.`}
                    </Text>
                    <Link to={formatPath(Paths.container.repository.list)}>
                      <Button variant='secondary'>{t`Open container list`}</Button>
                    </Link>
                  </CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>
                    <CardTitle>{t`Remote registries`}</CardTitle>
                    <Text component={TextVariants.p}>
                      {t`There are ${registryCount} configured remote registries for importing container images.`}
                    </Text>
                    <Link to={formatPath(Paths.container.remote.list)}>
                      <Button variant='secondary'>{t`Open remote registries`}</Button>
                    </Link>
                  </CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>
                    <CardTitle>{t`Top container repositories by image count`}</CardTitle>
                    <Text component={TextVariants.p}>
                      {t`These repositories contain the most stored Docker image manifests.`}
                    </Text>
                    <List isPlain>
                      {topRepositories.map((repo) => (
                        <ListItem key={repo.name}>
                          {repo.name}: {repo.imageCount} {t`images`}
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </GalleryItem>
            </Gallery>
          </section>
        )}
      </Main>
    </>
  );
};

export default ContainerDashboard;
