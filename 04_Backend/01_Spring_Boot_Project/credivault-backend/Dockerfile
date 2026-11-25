# Stage 1: Build Spring Boot application
FROM maven:3.10.2-eclipse-temurin-25-noble AS build

WORKDIR /app

COPY pom.xml .
COPY settings.xml .
COPY src ./src

RUN mvn -s settings.xml -B -DskipTests package

# Stage 2: Run application
FROM eclipse-temurin:25-jre-noble

WORKDIR /app

COPY --from=build /app/target/credivault-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-10000} -jar app.jar"]
