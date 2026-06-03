# Stage 1: Build the Angular UI
FROM node:22-alpine AS ui-build
WORKDIR /app
# Copy package files and install dependencies
COPY inkandlens/package*.json ./
RUN npm install
# Copy the rest of the Angular project and build
COPY inkandlens/ ./
RUN npm run build --configuration production

# Stage 2: Build the .NET API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
# Copy csproj and restore as distinct layers
COPY ["project-api/Project APIs.csproj", "project-api/"]
RUN dotnet restore "project-api/Project APIs.csproj"
# Copy everything else and build
COPY project-api/ project-api/
WORKDIR "/src/project-api"
RUN dotnet build "Project APIs.csproj" -c Release -o /app/build

# Stage 3: Publish the .NET API
FROM api-build AS publish
RUN dotnet publish "Project APIs.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Expose the standard ASP.NET Core port
EXPOSE 8080

# Ensure the uploads directory exists for file storage
RUN mkdir -p /app/wwwroot/uploads

# Copy the published API backend
COPY --from=publish /app/publish .

# Copy the built Angular UI into the API's wwwroot folder
COPY --from=ui-build /app/dist/inkandlens/browser ./wwwroot

# The .NET process will serve both the API and the UI
ENTRYPOINT ["dotnet", "Project APIs.dll"]
