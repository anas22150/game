FROM node:18-alpine

WORKDIR /app

# نسخ ملفات الاعتماديات أولاً لتحسين التخزين المؤقت
COPY package*.json ./

RUN npm install --production

# نسخ باقي الملفات
COPY . .

# تعريض المنفذ الذي يستخدمه الخادم
EXPOSE 3000

# متغير البيئة للمنفذ
ENV PORT=3000

# تشغيل التطبيق
CMD ["node", "server.js"]