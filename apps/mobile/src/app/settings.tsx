import type { ThemePreference } from "@ager/shared";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LOCALE_OPTIONS, useLocale, type Locale } from "@/i18n/locale-context";
import { t } from "@/i18n/i18n";
import { useTheme, useThemePreference } from "@/theme";

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labelFor: (value: T) => string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.colors.muted, borderRadius: theme.radius.md },
      ]}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[
              styles.segment,
              {
                backgroundColor: active ? theme.colors.card : "transparent",
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Text
              style={{
                color: active
                  ? theme.colors.foreground
                  : theme.colors.mutedForeground,
                fontFamily: active
                  ? theme.fonts.sansSemibold
                  : theme.fonts.sansMedium,
                fontSize: theme.fontSize.small,
              }}
            >
              {labelFor(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { preference, setPreference } = useThemePreference();
  const { locale, setLocale } = useLocale();

  function label(text: string, hint?: string) {
    return (
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.sansMedium,
            fontSize: theme.fontSize.body,
          }}
        >
          {text}
        </Text>
        {hint ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.caption,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen
        options={{ headerShown: true, title: t("Settings.title") }}
      />

      <View style={{ padding: theme.spacing.md, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          {label(t("Settings.theme"))}
          <Segmented
            options={THEME_OPTIONS}
            value={preference}
            onChange={setPreference}
            labelFor={(v) => t(`Settings.themeOptions.${v}`)}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          {label(t("Settings.language"))}
          <Segmented
            options={LOCALE_OPTIONS}
            value={locale}
            onChange={(v: Locale) => setLocale(v)}
            labelFor={(v) => t(`Settings.languageOptions.${v}`)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/mutes")}
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
            name="volume-mute-outline"
            size={20}
            color={theme.colors.primary}
          />
          {label(t("Mutes.title"))}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.mutedForeground}
          />
        </Pressable>

        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              opacity: 0.6,
            },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={theme.colors.mutedForeground}
          />
          {label(t("Settings.notifications"), t("Common.comingSoon"))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segmented: { flexDirection: "row", padding: 4, gap: 4 },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
