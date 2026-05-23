import React from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { APP_STORE_URL } from "../../constants/app";
import { profileStyles as styles } from "./profileStyles";

export function ColorPickerModal({
  visible,
  onClose,
  profileColor,
  onChooseColor,
}) {
  const colorOptions = [
    "#F65078",
    "#FF8A00",
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#7B61FF",
    "#FF4FD8",
    "#FFFFFF",
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Profile ring colour</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  profileColor === color && styles.colorCircleSelected,
                ]}
                onPress={() => onChooseColor(color)}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`Choose colour ${color}`}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.fullCancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function RatingModal({ visible, onClose, onRate, submittingRating }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Rate MoodSnap</Text>
          <Text style={styles.modalBody}>
            {submittingRating
              ? "Saving your rating..."
              : "How does MoodSnap feel today?"}
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.starButton,
                  submittingRating && styles.disabledButton,
                ]}
                onPress={() => onRate(rating)}
                disabled={submittingRating}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${rating} stars`}
              >
                <Text style={styles.starText}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {APP_STORE_URL ? (
            <TouchableOpacity
              style={[styles.saveButton, submittingRating && styles.disabledButton]}
              onPress={() => Linking.openURL(APP_STORE_URL)}
              disabled={submittingRating}
            >
              <Text style={styles.saveText}>Open in App Store</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.fullCancelButton, submittingRating && styles.disabledButton]}
            onPress={onClose}
            disabled={submittingRating}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function TermsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.termsCard}>
          <Text style={styles.modalTitle}>Terms of Service</Text>
          <ScrollView style={styles.termsScroll}>
            <Text style={styles.termsText}>
              Welcome to MoodSnap. MoodSnap is for sharing real mood moments with
              people you choose.
            </Text>
            <Text style={styles.termsText}>
              Be kind. Post only photos you have the right to share. Do not harass,
              impersonate, spam, scrape, or use MoodSnap for anything illegal or
              unsafe.
            </Text>
            <Text style={styles.termsText}>
              You own your photos, profile, and mood posts. You give MoodSnap
              permission to host, process, and show that content so the app can work
              for you and your friends.
            </Text>
            <Text style={styles.termsText}>
              We may remove content or accounts that break these terms, hurt other
              people, or put the service at risk. MoodSnap is provided as is, and
              some features may change as the app grows.
            </Text>
            <Text style={styles.termsText}>
              By using MoodSnap, you agree to keep the space honest, private, and fun
              for the people you add.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.saveText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function PrivacyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.termsCard}>
          <Text style={styles.modalTitle}>Privacy Policy</Text>
          <ScrollView style={styles.termsScroll}>
            <Text style={styles.termsText}>
              MoodSnap is built for sharing small, real moments with people you
              choose. Your profile, mood snaps, friend list, and mood calendar are
              used to make the app work and to show your content to accepted friends.
            </Text>
            <Text style={styles.termsText}>
              Your snaps are private by default. People who are not your accepted
              friends cannot see your feed photos through the app. You can add friends
              through your MoodSnap invite link, and you control who becomes your friend.
            </Text>
            <Text style={styles.termsText}>
              We store account details such as your email, username, profile photo,
              friend relationships, mood entries, and uploaded image links. Photos are
              hosted securely through Cloudinary and app data is stored through our
              backend database services.
            </Text>
            <Text style={styles.termsText}>
              We use your information to sign you in, verify your account, upload and
              display snaps, calculate streaks, show your calendar, manage friends, and
              keep the app safe from spam or misuse.
            </Text>
            <Text style={styles.termsText}>
              MoodSnap does not sell your personal information. You can update your
              profile or delete your account from Profile settings.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.saveText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function EditNameModal({
  visible,
  onClose,
  draftDisplayName,
  draftUsername,
  onChangeDraftDisplayName,
  onChangeDraftUsername,
  onSave,
  savingName,
  accentColor,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit profile</Text>
          <Text style={styles.inputLabel}>Display name</Text>
          <TextInput
            style={styles.nameInput}
            value={draftDisplayName}
            onChangeText={onChangeDraftDisplayName}
            placeholder="Display name"
            placeholderTextColor="#777"
            accessibilityLabel="Display name"
          />
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.usernameInputWrap}>
            <Text style={styles.usernamePrefix}>@</Text>
            <TextInput
              style={styles.usernameInput}
              value={draftUsername}
              onChangeText={onChangeDraftUsername}
              placeholder="username"
              placeholderTextColor="#777"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Username"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                accentColor && { backgroundColor: accentColor },
              ]}
              onPress={onSave}
              disabled={savingName}
            >
              <Text style={styles.saveText}>
                {savingName ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
