import { AuthError, type AuthErrorKind, useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { needsOnboarding } from "@/features/interests/interest-sections";
import { i18n, t } from "@/i18n/i18n";
import { apiClient } from "@/lib/api/client";
import { useTheme } from "@/theme";

const RESEND_COOLDOWN_SECONDS = 30;

type Step = "email" | "otp";

function errorMessage(kind: AuthErrorKind): string {
  switch (kind) {
    case "rate_limit":
      return t("SignIn.errors.rateLimit");
    case "invalid_code":
      return t("SignIn.errors.invalidCode");
    case "network":
      return t("SignIn.errors.network");
    case "request_failed":
      return t("SignIn.errors.requestFailed");
    default:
      return t("SignIn.errors.unknown");
  }
}

function toKind(error: unknown): AuthErrorKind {
  return error instanceof AuthError ? error.kind : "unknown";
}

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { requestOtp, verifyOtp } = useSession();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorKind, setErrorKind] = useState<AuthErrorKind | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(
      () => setResendSeconds((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  async function sendCode() {
    if (busy || email.trim().length === 0) return;
    setBusy(true);
    setErrorKind(null);
    try {
      await requestOtp(email.trim(), i18n.locale);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorKind(toKind(error));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (busy || resendSeconds > 0) return;
    setBusy(true);
    setErrorKind(null);
    try {
      await requestOtp(email.trim(), i18n.locale);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setErrorKind(toKind(error));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (busy || code.trim().length === 0) return;
    setBusy(true);
    setErrorKind(null);
    try {
      await verifyOtp(email.trim(), code.trim());
      // Onboarding gate (M5b): a new user with no interests goes to onboarding; everyone
      // else returns to where they were browsing. Fails open (skip) on a fetch error.
      let onboard = false;
      try {
        const { data } = await apiClient.GET("/api/me/interests");
        onboard = needsOnboarding(data);
      } catch {
        onboard = false;
      }
      if (onboard) {
        router.replace("/onboarding");
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (error) {
      setErrorKind(toKind(error));
      setBusy(false);
    }
  }

  function changeEmail() {
    setStep("email");
    setCode("");
    setErrorKind(null);
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
      color: theme.colors.foreground,
      borderRadius: theme.radius.md,
      fontFamily: theme.fonts.sans,
      fontSize: theme.fontSize.body,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("SignIn.close")}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
        style={styles.close}
      >
        <Ionicons name="close" size={26} color={theme.colors.mutedForeground} />
      </Pressable>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.content,
            { padding: theme.spacing.xl, gap: theme.spacing.lg },
          ]}
        >
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fonts.serifBold,
              fontSize: theme.fontSize.h1,
            }}
          >
            {t("SignIn.title")}
          </Text>

          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.body,
              lineHeight: theme.fontSize.body * theme.lineHeight.normal,
            }}
          >
            {step === "email"
              ? t("SignIn.emailStep.subtitle")
              : t("SignIn.otpStep.subtitle", { email: email.trim() })}
          </Text>

          {step === "email" ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.foreground,
                    fontFamily: theme.fonts.sansMedium,
                  },
                ]}
              >
                {t("SignIn.emailStep.emailLabel")}
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("SignIn.emailStep.emailPlaceholder")}
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                inputMode="email"
                editable={!busy}
                onSubmitEditing={sendCode}
                returnKeyType="send"
                style={inputStyle}
              />
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.foreground,
                    fontFamily: theme.fonts.sansMedium,
                  },
                ]}
              >
                {t("SignIn.otpStep.codeLabel")}
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder={t("SignIn.otpStep.codePlaceholder")}
                placeholderTextColor={theme.colors.mutedForeground}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                editable={!busy}
                onSubmitEditing={verify}
                returnKeyType="go"
                style={[inputStyle, styles.codeInput]}
              />
            </View>
          )}

          {errorKind && (
            <Text
              style={{
                color: theme.colors.destructive,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.small,
              }}
            >
              {errorMessage(errorKind)}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={step === "email" ? sendCode : verify}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
                opacity: busy || pressed ? 0.7 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text
                style={{
                  color: theme.colors.primaryForeground,
                  fontFamily: theme.fonts.sansSemibold,
                  fontSize: theme.fontSize.body,
                }}
              >
                {step === "email"
                  ? t("SignIn.emailStep.submit")
                  : t("SignIn.otpStep.submit")}
              </Text>
            )}
          </Pressable>

          {step === "otp" && (
            <View style={{ gap: theme.spacing.md, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                disabled={busy || resendSeconds > 0}
                onPress={resend}
              >
                <Text
                  style={{
                    color:
                      resendSeconds > 0
                        ? theme.colors.mutedForeground
                        : theme.colors.link,
                    fontFamily: theme.fonts.sansMedium,
                    fontSize: theme.fontSize.small,
                  }}
                >
                  {resendSeconds > 0
                    ? t("SignIn.otpStep.resendCooldown", {
                        seconds: resendSeconds,
                      })
                    : t("SignIn.otpStep.resend")}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={changeEmail}
              >
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontFamily: theme.fonts.sans,
                    fontSize: theme.fontSize.small,
                  }}
                >
                  {t("SignIn.otpStep.changeEmail")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  close: { position: "absolute", top: 8, right: 12, zIndex: 1, padding: 8 },
  content: { flex: 1, justifyContent: "center" },
  label: { fontSize: 14 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeInput: {
    letterSpacing: 8,
    textAlign: "center",
    fontSize: 22,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 52,
  },
});
