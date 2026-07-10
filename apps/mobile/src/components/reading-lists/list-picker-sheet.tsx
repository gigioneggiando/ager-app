import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { sortReadingLists } from "@/features/reading-lists/reading-lists-cache";
import {
  useAddToList,
  useReadingLists,
} from "@/features/reading-lists/use-reading-lists";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/** "Add to list" picker — the user's lists; tapping one saves the article there. */
export function ListPickerSheet({
  visible,
  articleId,
  onClose,
}: {
  visible: boolean;
  articleId: number;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { data, isPending } = useReadingLists();
  const addToList = useAddToList();

  const lists = sortReadingLists(data?.items ?? []);

  function add(listId: number) {
    addToList.mutate({ listId, articleId }, { onSettled: onClose });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.body,
          marginBottom: theme.spacing.sm,
        }}
      >
        {t("Lists.addToList")}
      </Text>

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        lists.map((list) => (
          <Pressable
            key={list.id}
            accessibilityRole="button"
            onPress={() => list.id != null && add(list.id)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? theme.colors.muted : "transparent" },
            ]}
          >
            <Ionicons
              name={list.isDefault ? "bookmark" : "bookmark-outline"}
              size={18}
              color={theme.colors.primary}
            />
            <Text
              style={{
                flex: 1,
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.body,
              }}
            >
              {list.name}
            </Text>
          </Pressable>
        ))
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
