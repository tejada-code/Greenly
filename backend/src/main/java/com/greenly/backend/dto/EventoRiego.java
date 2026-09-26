package com.greenly.backend.dto;

import java.time.LocalDate;

public record EventoRiego(
	Long plantaId,
	Long usuarioId,
	String usuarioEmail,
	String usuarioNombre,
	String nombrePlanta,
	TipoEventoRiego tipoEvento,
	LocalDate fechaCalculadaRiego,
	long diasRestantes,
	String titulo,
	String mensaje
) {
}
