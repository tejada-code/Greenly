package com.greenly.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "especies_catalogo")
public class EspecieCatalogo {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "nombre_cientifico", nullable = false, unique = true, length = 150)
	private String nombreCientifico;

	@Column(name = "nombre_comun", length = 150)
	private String nombreComun;

	@Enumerated(EnumType.STRING)
	@Column(name = "luz_recomendada", length = 30)
	private LuzRecomendada luzRecomendada;

	@Column(name = "frecuencia_riego_base_dias", nullable = false)
	private Integer frecuenciaRiegoBaseDias;

	@Column(columnDefinition = "TEXT")
	private String descripcion;

	protected EspecieCatalogo() {
	}

	public EspecieCatalogo(
		String nombreCientifico,
		String nombreComun,
		LuzRecomendada luzRecomendada,
		Integer frecuenciaRiegoBaseDias,
		String descripcion
	) {
		this.nombreCientifico = nombreCientifico;
		this.nombreComun = nombreComun;
		this.luzRecomendada = luzRecomendada;
		this.frecuenciaRiegoBaseDias = frecuenciaRiegoBaseDias;
		this.descripcion = descripcion;
	}

	public String getNombreCientifico() {
		return nombreCientifico;
	}

	public String getNombreComun() {
		return nombreComun;
	}

	public LuzRecomendada getLuzRecomendada() {
		return luzRecomendada;
	}

	public Integer getFrecuenciaRiegoBaseDias() {
		return frecuenciaRiegoBaseDias;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public enum LuzRecomendada {
		SOL_DIRECTO,
		SEMISOMBRA,
		INTERIOR_LUMINOSO,
		SOMBRA
	}
}