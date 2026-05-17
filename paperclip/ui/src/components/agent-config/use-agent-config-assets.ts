import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "../../api/assets";
import { secretsApi } from "../../api/secrets";
import { queryKeys } from "../../lib/queryKeys";

export function useAgentConfigAssets(selectedCompanyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { data: availableSecrets = [] } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.secrets.list(selectedCompanyId) : ["secrets", "none"],
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const createSecretMutation = useMutation({
    mutationFn: (input: { name: string; value: string }) => {
      if (!selectedCompanyId) throw new Error("Select a company to create secrets");
      return secretsApi.create(selectedCompanyId, input);
    },
    onSuccess: () => {
      if (!selectedCompanyId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(selectedCompanyId) });
    },
  });
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, namespace }: { file: File; namespace: string }) => {
      if (!selectedCompanyId) throw new Error("Select a company to upload images");
      return assetsApi.uploadImage(selectedCompanyId, file, namespace);
    },
  });

  return {
    availableSecrets,
    createSecret: (name: string, value: string) => createSecretMutation.mutateAsync({ name, value }),
    uploadImage: async (file: File, namespace: string) => {
      const asset = await uploadImageMutation.mutateAsync({ file, namespace });
      return asset.contentPath;
    },
  };
}
