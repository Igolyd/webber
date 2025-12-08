# 1. Этап сборки Nuxt
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx nuxi build


# 2. Прод-образ
FROM node:20-alpine

WORKDIR /app

# Копируем собранный .output
COPY --from=build /app/.output ./.output
# Копируем node_modules из этапа сборки
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]