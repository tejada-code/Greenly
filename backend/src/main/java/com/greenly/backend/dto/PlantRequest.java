package com.greenly.backend.dto;

import java.time.LocalDate;

public record PlantRequest(
	String nombreCientifico,
	String nombreComun,
	String nombrePersonalizado,
	String urlFotoUsuario,
	LocalDate fechaAdquisicion
) {
}