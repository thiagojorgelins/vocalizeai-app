import ButtonCustom from "@/components/Button";
import ConfirmationModal from "@/components/ConfirmationModal";
import Select from "@/components/Select";
import { uploadAudioFile } from "@/services/audioService";
import { getVocalizacoes } from "@/services/vocalizacoesService";
import { AudioRecording } from "@/types/AudioRecording";
import { Vocalizacao } from "@/types/Vocalizacao";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import translateVocalization from "@/utils/TranslateVocalization";

export default function AudiosScreen() {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] =
    useState<AudioRecording | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [editVocalizationId, setEditVocalizationId] = useState("");
  const [vocalizations, setVocalizations] = useState<Vocalizacao[]>([]);
  const [loadingVocalizations, setLoadingVocalizations] = useState(false);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRecordings();
    }, [])
  );

  async function fetchRecordings() {
    try {
      const stogreenRecordings = await AsyncStorage.getItem("recordings");
      if (stogreenRecordings) {
        setRecordings(JSON.parse(stogreenRecordings));
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Erro ao buscar gravações",
        type: "danger",
      });
    } finally {
      setLoadingVocalizations(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  async function handlePlayAudio(uri: string) {
    try {
      if (playingUri === uri) {
        await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
        setPlayingUri(null);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        setPlayingUri(uri);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingUri(null);
          }
        });
      }
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Erro ao reproduzir áudio " + error,
        type: "danger",
      });
    }
  }

  async function handleDeleteAudio(recording: AudioRecording) {
    try {
      await FileSystem.deleteAsync(recording.uri);

      const updated = recordings.filter(
        (item) => item.timestamp !== recording.timestamp
      );
      setRecordings(updated);
      await AsyncStorage.setItem("recordings", JSON.stringify(updated));
      setShowOptionsModal(false);
      setShowConfirmDeleteModal(false);
      setSelectedRecording(null);
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Erro ao excluir o áudio",
        type: "danger",
      });
    }
  }

  async function handleUpdateVocalizationId() {
    if (!selectedRecording) return;

    try {
      const newId = parseInt(editVocalizationId, 10) || 0;
      const vocalization = vocalizations.find((voc) => voc.id === newId);

      const updatedList = recordings.map((rec) => {
        if (rec.timestamp === selectedRecording.timestamp) {
          return {
            ...rec,
            vocalizationId: newId,
            vocalizationName: vocalization?.nome || "",
          };
        }
        return rec;
      });

      await AsyncStorage.setItem("recordings", JSON.stringify(updatedList));
      setRecordings(updatedList);

      showMessage({
        message: "Sucesso",
        description: "Vocalização atualizada com sucesso!",
        type: "success",
      });

      setShowUpdateConfirmModal(false);
      setShowOptionsModal(false);
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Erro ao atualizar vocalização",
        type: "danger",
      });
    }
  }

  async function fetchVocalizations() {
    try {
      const vocalizations = await getVocalizacoes();
      setVocalizations(vocalizations);
    } catch (error: any) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar as vocalizações",
        type: "danger",
      });
    }
  }

  async function handleUpload(idVocalizacao: number, fileUri: string) {
    try {
      await uploadAudioFile(idVocalizacao, fileUri);

      if (selectedRecording) {
        const updateRecordings = recordings.map((rec) => {
          if (rec.timestamp === selectedRecording.timestamp) {
            return { ...rec, status: "sent" };
          }
          return rec;
        });
        setRecordings(updateRecordings);
        await AsyncStorage.setItem(
          "recordings",
          JSON.stringify(updateRecordings)
        );
        setShowOptionsModal(false);
      }
      showMessage({
        message: "Sucesso",
        description: "Áudio enviado com sucesso!",
        type: "success",
      });
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Erro ao enviar áudio",
        type: "danger",
      });
    }
  }

  async function handlePressRecording(rec: AudioRecording) {
    if (vocalizations.length === 0) {
      await fetchVocalizations();
    }
    setSelectedRecording(rec);
    setEditVocalizationId(String(rec.vocalizationId));
    setShowOptionsModal(true);
  }

  const renderRecording = ({ item }: { item: AudioRecording }) => (
    <TouchableOpacity onPress={() => handlePressRecording(item)}>
      <View
        style={[
          styles.recordingItem,
          item.status === "sent"
            ? { backgroundColor: "#26ba2d" }
            : { backgroundColor: "#F5F5F5" },
        ]}
      >
        <MaterialIcons
          name="audio-file"
          size={54}
          color={item.status === "sent" ? "white" : "black"}
        />
        <View style={styles.recordingItemData}>
          <View>
            <Text
              style={[
                { fontWeight: "bold" },
                item.status === "sent" && { color: "white" },
              ]}
            >
              {item.uri.split("_")[1]}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={[
                { fontWeight: "bold" },
                item.status === "sent" && { color: "white" },
              ]}
            >
              {translateVocalization[item.vocalizationName] ||
                item.vocalizationName}
            </Text>
            <Text
              style={[
                { fontWeight: "bold" },
                item.status === "sent" && { color: "white" },
              ]}
            >
              {new Date(item.timestamp).toLocaleString("pt-BR")}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handlePlayAudio(item.uri)}>
          <MaterialIcons
            name={playingUri === item.uri ? "pause" : "play-arrow"}
            size={32}
            color={item.status === "sent" ? "white" : "black"}
          />
          <Text
            style={[
              { fontWeight: "bold" },
              item.status === "sent" && { color: "white" },
            ]}
          >
            {formatTime(item.duration)}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Áudios Gravados</Text>
      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={(item) => item.timestamp.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma gravação encontrada</Text>
        }
      />
      <ConfirmationModal
        visible={showUpdateConfirmModal}
        onCancel={() => setShowUpdateConfirmModal(false)}
        onConfirm={handleUpdateVocalizationId}
        message="Confirma a atualização da vocalização?"
      />
      <ConfirmationModal
        visible={showConfirmDeleteModal}
        onCancel={() => setShowConfirmDeleteModal(false)}
        onConfirm={() =>
          selectedRecording && handleDeleteAudio(selectedRecording)
        }
        message="Tem certeza que deseja excluir a gravação?"
      />
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções da Gravação</Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                style={styles.modalClose}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRecording && (
              <View style={styles.recordingInfo}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {new Date(selectedRecording.timestamp).toLocaleString(
                      "pt-BR"
                    )}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="timer" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {formatTime(selectedRecording.duration)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="label" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {translateVocalization[
                      selectedRecording.vocalizationName
                    ] || selectedRecording.vocalizationName}
                  </Text>
                </View>
              </View>
            )}

            {loadingVocalizations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
              </View>
            ) : (
              <View style={styles.selectContainer}>
                <Select
                  label="Vocalização"
                  selectedValue={editVocalizationId}
                  onValueChange={(value) => {
                    setEditVocalizationId(value);
                    const vocalization = vocalizations.find(
                      (v) => v.id === parseInt(value)
                    );
                    if (selectedRecording && vocalization) {
                      setSelectedRecording({
                        ...selectedRecording,
                        vocalizationId: vocalization.id,
                        vocalizationName: vocalization.nome,
                      });
                    }
                  }}
                  options={vocalizations.map((voc) => ({
                    label: translateVocalization[voc.nome] || voc.nome,
                    value: voc.id.toString(),
                  }))}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <ButtonCustom
                title="Atualizar Rótulo"
                onPress={() => setShowUpdateConfirmModal(true)}
                color="#2196F3"
                style={styles.actionButton}
                icon={<MaterialIcons name="edit" size={20} color="#FFF" />}
              />

              <ButtonCustom
                title="Enviar Áudio"
                onPress={() =>
                  selectedRecording &&
                  handleUpload(
                    selectedRecording.vocalizationId,
                    selectedRecording.uri
                  )
                }
                color="#4CAF50"
                style={styles.actionButton}
                icon={
                  <MaterialIcons name="cloud-upload" size={20} color="#FFF" />
                }
              />

              <ButtonCustom
                title="Excluir áudio"
                onPress={() => setShowConfirmDeleteModal(true)}
                color="#F44336"
                style={styles.actionButton}
                icon={<MaterialIcons name="delete" size={20} color="#FFF" />}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2C3E50",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  recordingItem: {
    flexDirection: "row",
    marginBottom: 12,
    width: "100%",
    borderRadius: 12,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
  },
  recordingItemData: {
    width: "70%",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  modalClose: {
    padding: 4,
  },
  recordingInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  selectContainer: {
    marginBottom: 20,
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 0,
  },
});
