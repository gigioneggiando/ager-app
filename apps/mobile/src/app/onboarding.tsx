import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InterestPicker } from "@/components/interests/interest-picker";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/**
 * Onboarding (M5b): the real interests picker. A signed-in user with no interests lands here
 * (routed from sign-in). Choosing + saving → the feed; skipping also goes to the feed (state
 * is server truth, so a skipper is prompted again next login).
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();

  function finish() {
    router.replace("/");
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <InterestPicker
        onSaved={finish}
        onSkip={finish}
        saveLabel={t("Onboarding.save")}
        header={
          <>
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.serifBold,
                fontSize: theme.fontSize.h1,
              }}
            >
              {t("Onboarding.title")}
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.body,
                lineHeight: theme.fontSize.body * theme.lineHeight.normal,
              }}
            >
              {t("Onboarding.subtitle")}
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
