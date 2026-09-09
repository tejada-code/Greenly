package com.greenly.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "plantas_usuario")
public class PlantaUsuario {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Column(name = "nombre_cientifico", nullable = false, length = 150)
	private String nombreCientifico;

	@Column(name = "nombre_personalizado", length = 100)
	private String nombrePersonalizado;

	@Column(name = "url_foto_usuario", length = 255)
	private String urlFotoUsuario;

	@Column(name = "fecha_adquisicion")
	private LocalDate fechaAdquisicion;

	@Column(name = "fecha_registro", nullable = false)
	private LocalDateTime fechaRegistro;

	protected PlantaUsuario() {
	}

	public PlantaUsuario(Usuario usuario, String nombreCientifico) {
		this.usuario = usuario;
		this.nombreCientifico = nombreCientifico;
		this.fechaRegistro = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Usuario getUsuario() {
		return usuario;
	}

	public String getNombreCientifico() {
		return nombreCientifico;
	}

	public String getNombrePersonalizado() {
		return nombrePersonalizado;
	}

	public String getUrlFotoUsuario() {
		return urlFotoUsuario;
	}

	public LocalDate getFechaAdquisicion() {
		return fechaAdquisicion;
	}

	public LocalDateTime getFechaRegistro() {
		return fechaRegistro;
	}
}