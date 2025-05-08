import Select from "@/components/Select";
import translateVocalization from "@/utils/TranslateVocalization";
import React from "react";
import { VocalizationSelectProps } from "@/types/VocalizationSelectProps";
import { MaterialIcons } from "@expo/vector-icons";

export default function VocalizationSelect({
  vocalizations,
  selectedVocalizationId,
  onValueChange,
  label = "Tipo de Vocalização",
  placeholder,
}: VocalizationSelectProps) {
  const sortedOptions = vocalizations
    .map((voc) => ({
      id: voc.id,
      value: voc.id.toString(),
      label: translateVocalization[voc.nome] || voc.nome,
      original: voc.nome,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <Select
      placeholder={placeholder}
      leftIcon={<MaterialIcons name="record-voice-over" size={20} color="#666" />}
      label={label}
      selectedValue={selectedVocalizationId?.toString() || ""}
      onValueChange={(itemValue) => onValueChange(Number(itemValue))}
      options={sortedOptions.map((option) => ({
        label: option.label,
        value: option.value,
      }))}
    />
  );
}
