# ---- Build Stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY dotnet-Backend.csproj ./
RUN dotnet restore

# Copy all files
COPY . ./
RUN dotnet publish -c Release -o /app/out

# ---- Runtime Stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/out .

EXPOSE 10000

ENTRYPOINT ["dotnet", "dotnet-Backend.dll"]