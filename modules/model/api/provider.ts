import { s } from '@/router/init';
import { contract } from '@/contract';
import { aiproxyIdMap, ModelProviders } from '../constants';
import { publicS3Server } from '@/s3';
import { getModelAvatarUrl } from '../avatars';

export const getProvidersHandler = s.route(contract.model.getProviders, async () => {
  // Convert avatar paths to full URLs
  const aiproxyIdMapWithUrls = Object.fromEntries(
    await Promise.all(
      Object.entries(aiproxyIdMap).map(async ([key, value]) => {
        let avatarUrl = value.avatar;

        // If no avatar is set, try to generate one from the provider
        if (!avatarUrl) {
          try {
            avatarUrl = await getModelAvatarUrl(value.provider);
          } catch (error) {
            // If avatar generation fails, leave as undefined
            avatarUrl = undefined;
          }
        } else {
          // Convert existing S3 paths to full URLs
          if (value.avatar.startsWith('plugins/') || value.avatar.startsWith('model/')) {
            avatarUrl = await publicS3Server.generateExternalUrl(value.avatar);
          }
        }

        return [
          key,
          {
            ...value,
            avatar: avatarUrl
          }
        ];
      })
    )
  );

  return {
    status: 200,
    body: {
      modelProviders: ModelProviders,
      aiproxyIdMap: aiproxyIdMapWithUrls
    }
  };
});
