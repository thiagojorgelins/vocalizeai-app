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
import { useCallback, useState } from "react";
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
import ButtonCustom from "@/components/Button";

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
            ? { backgroundColor: "green" }
            : { backgroundColor: "#D8D8D8" },
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
              {item.vocalizationName}
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
        <TouchableOpacity
          onPress={() => handlePlayAudio(item.uri)}
        >
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
            <Text style={styles.modalTitle}>Opções da Gravação</Text>

            {selectedRecording && (
              <View style={{ marginBottom: 16 }}>
                <Text>
                  Data/Hora:{" "}
                  {new Date(selectedRecording.timestamp).toLocaleString(
                    "pt-BR"
                  )}
                </Text>
                <Text>Duração: {formatTime(selectedRecording.duration)}</Text>
                <Text>Rótulo: {selectedRecording.vocalizationName}</Text>
              </View>
            )}

            <Text style={{ fontWeight: "bold" }}>ID da Vocalização:</Text>
            {loadingVocalizations ? (
              <ActivityIndicator size="large" color="#000"></ActivityIndicator>
            ) : (
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
                  label: voc.nome,
                  value: voc.id.toString(),
                }))}
                style={{ width: "100%" }}
              />
            )}
            <View style={styles.buttonRow}>
              <ButtonCustom
                title="Atualizar Rótulo"
                onPress={() => setShowUpdateConfirmModal(true)}
              />
            </View>

            <View style={styles.buttonRow}>
              <ButtonCustom
                title="Enviar Áudio"
                onPress={() =>
                  selectedRecording &&
                  handleUpload(
                    selectedRecording.vocalizationId,
                    selectedRecording.uri
                  )
                }
                color="green"
              />
            </View>

            <View style={styles.buttonRow}>
              <ButtonCustom
                title="Excluir áudio"
                onPress={() => setShowConfirmDeleteModal(true)}
                color="red"
              />
            </View>

            <View style={[styles.buttonRow, { marginTop: 20 }]}>
              <ButtonCustom
                title="Fechar"
                onPress={() => setShowOptionsModal(false)}
                color="black"
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
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  recordingItem: {
    flexDirection: "row",
    marginBottom: 8,
    width: "100%",
    borderRadius: 8,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordingItemData: {
    width: "70%",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  buttonRow: {
    marginVertical: 5,
  },
});
