import { useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthRequired } from "@/components/states/auth-required";
import { MessageState } from "@/components/states/message-state";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { sortReadingLists } from "@/features/reading-lists/reading-lists-cache";
import {
  useCreateList,
  useDeleteList,
  useReadingLists,
} from "@/features/reading-lists/use-reading-lists";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

export default function SavedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status } = useSession();
  const { data, isPending, isError } = useReadingLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const lists = useMemo(
    () => sortReadingLists(data?.items ?? []),
    [data?.items],
  );

  if (status !== "authenticated") {
    return <AuthRequired description={t("AuthPrompt.savedDescription")} />;
  }

  function submitCreate() {
    const name = newName.trim();
    if (!name || createList.isPending) return;
    createList.mutate(
      { name },
      {
        onSettled: () => {
          setNewName("");
          setCreating(false);
        },
      },
    );
  }

  function confirmDelete(listId: number, name: string) {
    Alert.alert(t("Lists.deleteTitle"), t("Lists.deleteMessage", { name }), [
      { text: t("Lists.cancel"), style: "cancel" },
      {
        text: t("Lists.delete"),
        style: "destructive",
        onPress: () => deleteList.mutate(listId),
      },
    ]);
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { padding: theme.spacing.md }]}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.serifBold,
            fontSize: theme.fontSize.h1,
          }}
        >
          {t("Tabs.saved")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Lists.newList")}
          onPress={() => setCreating(true)}
          style={styles.newButton}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <MessageState
              icon="alert-circle-outline"
              title={t("Lists.errorTitle")}
              tint={theme.colors.destructive}
            />
          ) : (
            <MessageState
              icon="bookmark-outline"
              title={t("Lists.emptyTitle")}
              description={t("Lists.emptyDescription")}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/list/[id]",
                params: { id: String(item.id) },
              })
            }
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? theme.colors.muted
                  : theme.colors.card,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Ionicons
              name={item.isDefault ? "bookmark" : "bookmark-outline"}
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.rowText}>
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontFamily: theme.fonts.sansSemibold,
                  fontSize: theme.fontSize.body,
                }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.fonts.sans,
                  fontSize: theme.fontSize.caption,
                }}
              >
                {t("Lists.itemCount", { count: item.itemsCount ?? 0 })}
              </Text>
            </View>
            {!item.isDefault ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Lists.delete")}
                hitSlop={8}
                onPress={() =>
                  confirmDelete(item.id as number, item.name ?? "")
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={theme.colors.mutedForeground}
                />
              </Pressable>
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.mutedForeground}
            />
          </Pressable>
        )}
      />

      <BottomSheet visible={creating} onClose={() => setCreating(false)}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.sansSemibold,
            fontSize: theme.fontSize.body,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t("Lists.newList")}
        </Text>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={t("Lists.namePlaceholder")}
          placeholderTextColor={theme.colors.mutedForeground}
          autoFocus
          onSubmitEditing={submitCreate}
          returnKeyType="done"
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              color: theme.colors.foreground,
              borderRadius: theme.radius.md,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.body,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          disabled={createList.isPending || newName.trim().length === 0}
          onPress={submitCreate}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.md,
              opacity:
                createList.isPending || newName.trim().length === 0 || pressed
                  ? 0.7
                  : 1,
            },
          ]}
        >
          {createList.isPending ? (
            <ActivityIndicator color={theme.colors.primaryForeground} />
          ) : (
            <Text
              style={{
                color: theme.colors.primaryForeground,
                fontFamily: theme.fonts.sansSemibold,
                fontSize: theme.fontSize.body,
              }}
            >
              {t("Lists.create")}
            </Text>
          )}
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newButton: { padding: 4 },
  center: { minHeight: 300, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  rowText: { flex: 1, gap: 2 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  createButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 50,
  },
});
