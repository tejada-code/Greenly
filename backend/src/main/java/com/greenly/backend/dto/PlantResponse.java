package com.greenly.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PlantResponse(
	Long id,
	String nombreCientifico,
	String nombreComun,
	String luzRecomendada,
	Integer frecuenciaRiegoBaseDias,
	String nombrePersonalizado,
	String urlFotoUsuario,
	LocalDate fechaAdquisicion,
	LocalDateTime fechaRegistro
) {
}