import { Stack } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InterestPicker } from "@/components/interests/interest-picker";
import { SuggestedInterests } from "@/components/interests/suggested-interests";
import { MessageState } from "@/components/states/message-state";
import { selectedInterestIds } from "@/features/interests/interest-sections";
import { useMyInterests } from "@/features/interests/use-interests";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/** Interests editor (M5b): pre-selects the user's current interests + the suggestions nudge. */
export default function InterestsScreen() {
  const theme = useTheme();
  const { data: mine, isPending, isError } = useMyInterests();
  const selectedIds = selectedInterestIds(mine);

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{ headerShown: true, title: t("Onboarding.editTitle") }}
      />

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : isError ? (
        <MessageState
          icon="alert-circle-outline"
          title={t("Onboarding.loadError")}
          tint={theme.colors.destructive}
        />
      ) : (
        <InterestPicker
          // Re-init the picker's selection once the current set loads.
          key={selectedIds.join(",")}
          initialSelected={selectedIds}
          onSaved={() => Alert.alert(t("Onboarding.savedHint"))}
          saveLabel={t("Onboarding.save")}
          header={
            <>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.fonts.sans,
                  fontSize: theme.fontSize.body,
                  lineHeight: theme.fontSize.body * theme.lineHeight.normal,
                }}
              >
                {t("Onboarding.editSubtitle")}
              </Text>
              <SuggestedInterests />
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
