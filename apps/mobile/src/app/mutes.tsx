import { Stack } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessageState } from "@/components/states/message-state";
import {
  useMutedInterests,
  useMutedSources,
  useUnmuteInterest,
  useUnmuteSource,
} from "@/features/mutes/use-mutes";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

function UnmuteRow({
  label,
  onUnmute,
}: {
  label: string;
  onUnmute: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Text
        style={{
          flex: 1,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sansMedium,
          fontSize: theme.fontSize.body,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        accessibilityRole="button"
        onPress={onUnmute}
        style={{
          color: theme.colors.link,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.small,
        }}
      >
        {t("Mutes.unmute")}
      </Text>
    </View>
  );
}

export default function MutesScreen() {
  const theme = useTheme();
  const interests = useMutedInterests();
  const sources = useMutedSources();
  const unmuteInterest = useUnmuteInterest();
  const unmuteSource = useUnmuteSource();

  const loading = interests.isPending || sources.isPending;
  const error = interests.isError || sources.isError;
  const empty =
    (interests.data?.length ?? 0) === 0 && (sources.data?.length ?? 0) === 0;

  function sectionTitle(text: string) {
    return (
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.small,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginTop: theme.spacing.md,
        }}
      >
        {text}
      </Text>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: true, title: t("Mutes.title") }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <MessageState
          icon="alert-circle-outline"
          title={t("Mutes.errorTitle")}
          tint={theme.colors.destructive}
        />
      ) : empty ? (
        <MessageState
          icon="volume-mute-outline"
          title={t("Mutes.emptyTitle")}
          description={t("Mutes.emptyDescription")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.md,
            gap: theme.spacing.sm,
          }}
        >
          {(interests.data?.length ?? 0) > 0 ? (
            <>
              {sectionTitle(t("Mutes.topics"))}
              {interests.data?.map((m) => (
                <UnmuteRow
                  key={`i-${m.interestId}`}
                  label={m.slug ?? String(m.interestId)}
                  onUnmute={() => unmuteInterest.mutate(m.interestId as number)}
                />
              ))}
            </>
          ) : null}

          {(sources.data?.length ?? 0) > 0 ? (
            <>
              {sectionTitle(t("Mutes.sources"))}
              {sources.data?.map((m) => (
                <UnmuteRow
                  key={`s-${m.sourceId}`}
                  label={m.name ?? String(m.sourceId)}
                  onUnmute={() => unmuteSource.mutate(m.sourceId as number)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
