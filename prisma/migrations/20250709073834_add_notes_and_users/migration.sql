-- CreateTable
CREATE TABLE "presentations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsed" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "noteId" TEXT,
    CONSTRAINT "presentations_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "slides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presentationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "styling" JSONB NOT NULL,
    "animations" JSONB,
    "transitions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "slides_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "presentations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "text_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slideId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fontSize" TEXT NOT NULL DEFAULT '48px',
    "fontFamily" TEXT NOT NULL DEFAULT 'Arial, sans-serif',
    "fontWeight" TEXT NOT NULL DEFAULT 'normal',
    "textAlign" TEXT NOT NULL DEFAULT 'center',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT NOT NULL DEFAULT 'transparent',
    "lineHeight" REAL NOT NULL DEFAULT 1.2,
    "padding" JSONB NOT NULL,
    "textEffects" JSONB,
    "typography" JSONB,
    CONSTRAINT "text_content_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "slides" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slideId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "displayMode" TEXT NOT NULL DEFAULT 'fit',
    "positioning" JSONB NOT NULL,
    "scaling" JSONB NOT NULL,
    "playbackSettings" JSONB NOT NULL,
    "overlays" JSONB,
    CONSTRAINT "media_content_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "slides" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_content_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "media_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rich_text_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slideId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "styling" JSONB NOT NULL,
    "formatting" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "metadata" JSONB,
    CONSTRAINT "rich_text_content_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "slides" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "tags" TEXT,
    "category" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsed" DATETIME
);

-- CreateTable
CREATE TABLE "slide_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "defaultContent" JSONB NOT NULL,
    "defaultStyling" JSONB NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "slide_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colorPalette" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "backgrounds" JSONB NOT NULL,
    "animations" JSONB,
    "transitions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "_MediaItemToPresentation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MediaItemToPresentation_A_fkey" FOREIGN KEY ("A") REFERENCES "media_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MediaItemToPresentation_B_fkey" FOREIGN KEY ("B") REFERENCES "presentations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "slides_presentationId_idx" ON "slides"("presentationId");

-- CreateIndex
CREATE INDEX "slides_type_idx" ON "slides"("type");

-- CreateIndex
CREATE INDEX "slides_order_idx" ON "slides"("order");

-- CreateIndex
CREATE UNIQUE INDEX "text_content_slideId_key" ON "text_content"("slideId");

-- CreateIndex
CREATE UNIQUE INDEX "media_content_slideId_key" ON "media_content"("slideId");

-- CreateIndex
CREATE UNIQUE INDEX "rich_text_content_slideId_key" ON "rich_text_content"("slideId");

-- CreateIndex
CREATE INDEX "media_items_type_idx" ON "media_items"("type");

-- CreateIndex
CREATE INDEX "media_items_category_idx" ON "media_items"("category");

-- CreateIndex
CREATE INDEX "slide_templates_type_idx" ON "slide_templates"("type");

-- CreateIndex
CREATE INDEX "slide_templates_category_idx" ON "slide_templates"("category");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_MediaItemToPresentation_AB_unique" ON "_MediaItemToPresentation"("A", "B");

-- CreateIndex
CREATE INDEX "_MediaItemToPresentation_B_index" ON "_MediaItemToPresentation"("B");
