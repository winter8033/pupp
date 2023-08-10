FROM node:14

RUN apt-get update && apt-get install -y \
    xvfb \
    dbus \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    -- no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV DISPLAY=:99

CMD Xvfb:99 -screen 0 1024x768x16 -ac+extension RANDR & \
    dbus-daemon --session --fork && \
    npm start