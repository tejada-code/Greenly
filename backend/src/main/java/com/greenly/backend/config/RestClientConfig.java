package com.greenly.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
	@Bean
	public RestClient.Builder restClientBuilder() {
		return RestClient.builder()
			.messageConverters(converters -> converters.add(new MappingJackson2HttpMessageConverter()));
	}
}
