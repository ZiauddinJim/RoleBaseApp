# ---- Build Stage ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY dotnet-Backend/dotnet-Backend.csproj ./
RUN dotnet restore

COPY dotnet-Backend/ ./
RUN dotnet publish -c Release -o /app/out

# ---- Runtime Stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/out .

EXPOSE 10000

ENTRYPOINT ["dotnet", "dotnet-Backend.dll"]