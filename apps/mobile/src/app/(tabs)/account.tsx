import { useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthRequired } from "@/components/states/auth-required";
import {
  useDeleteAccount,
  useExportData,
} from "@/features/account/use-account";
import { useSignOut } from "@/features/auth/use-sign-out";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function Row({
  icon,
  label,
  onPress,
  trailing,
  destructive,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const color = destructive
    ? theme.colors.destructive
    : theme.colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.muted : theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? theme.colors.destructive : theme.colors.primary}
      />
      <Text
        style={{
          flex: 1,
          color,
          fontFamily: theme.fonts.sansMedium,
          fontSize: theme.fontSize.body,
        }}
      >
        {label}
      </Text>
      {trailing !== undefined ? (
        trailing
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.mutedForeground}
        />
      )}
    </Pressable>
  );
}

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, user } = useSession();
  const signOut = useSignOut();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();

  if (status !== "authenticated") {
    return <AuthRequired description={t("AuthPrompt.accountDescription")} />;
  }

  function handleExport() {
    if (exportData.isPending) return;
    exportData.mutate(undefined, {
      onError: (err) =>
        Alert.alert(
          t("Account.exportErrorTitle"),
          err instanceof Error && err.message === "rate_limited"
            ? t("Account.exportRateLimited")
            : t("Account.exportError"),
        ),
    });
  }

  function handleDelete() {
    Alert.alert(t("Account.deleteTitle"), t("Account.deleteMessage"), [
      { text: t("Account.cancel"), style: "cancel" },
      {
        text: t("Account.deleteConfirm"),
        style: "destructive",
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onSuccess: async () => {
              await signOut();
              router.replace("/"); // back to the anonymous feed
            },
            onError: () =>
              Alert.alert(
                t("Account.deleteErrorTitle"),
                t("Account.deleteError"),
              ),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.serifBold,
            fontSize: theme.fontSize.h1,
            marginBottom: theme.spacing.xs,
          }}
        >
          {t("Tabs.account")}
        </Text>

        {user?.email ? (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.small,
              }}
            >
              {t("Account.signedInAs")}
            </Text>
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sansMedium,
                fontSize: theme.fontSize.body,
              }}
            >
              {user.email}
            </Text>
          </View>
        ) : null}

        <Row
          icon="stats-chart-outline"
          label={t("Stats.title")}
          onPress={() => router.push("/stats")}
        />
        <Row
          icon="settings-outline"
          label={t("Settings.title")}
          onPress={() => router.push("/settings")}
        />
        <Row
          icon="download-outline"
          label={t("Account.exportData")}
          onPress={handleExport}
          trailing={
            exportData.isPending ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : null
          }
        />
        <Row
          icon="trash-outline"
          label={t("Account.deleteAccount")}
          onPress={handleDelete}
          destructive
          trailing={
            deleteAccount.isPending ? (
              <ActivityIndicator color={theme.colors.destructive} />
            ) : null
          }
        />
        <Row
          icon="log-out-outline"
          label={t("Account.signOut")}
          onPress={signOut}
          destructive
          trailing={null}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
