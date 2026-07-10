import { useSession } from "@ager/auth";

import { ScreenPlaceholder } from "@/components/screen-placeholder";
import { AuthRequired } from "@/components/states/auth-required";
import { t } from "@/i18n/i18n";

export default function SavedScreen() {
  const { status } = useSession();

  if (status !== "authenticated") {
    return <AuthRequired description={t("AuthPrompt.savedDescription")} />;
  }

  // Reading lists land in M4b.
  return <ScreenPlaceholder icon="bookmark-outline" title={t("Tabs.saved")} />;
}
