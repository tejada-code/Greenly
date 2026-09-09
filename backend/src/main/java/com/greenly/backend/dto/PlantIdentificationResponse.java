package com.greenly.backend.dto;

import java.util.List;

public record PlantIdentificationResponse(
	String nombreCientifico,
	String nombreComun,
	String familia,
	double confianza,
	CareData cuidados,
	List<AlternativeResult> resultadosAlternativos
) {
	public record CareData(String luz, Integer riegoCadaDias, String descripcion) {
	}

	public record AlternativeResult(String nombreCientifico, double confianza) {
	}
}