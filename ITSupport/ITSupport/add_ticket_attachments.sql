-- Run against the same LocalDB database specified in appsettings.json.
-- Safe for existing tickets and repeat execution.
IF OBJECT_ID(N'dbo.TicketAttachments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TicketAttachments (
        Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TicketId int NOT NULL,
        OriginalFileName nvarchar(260) NOT NULL,
        StoredFileName nvarchar(260) NOT NULL,
        ContentType nvarchar(255) NOT NULL,
        SizeBytes bigint NOT NULL,
        UploadedAt datetime2 NOT NULL,
        CONSTRAINT FK_TicketAttachments_Tickets_TicketId FOREIGN KEY (TicketId)
            REFERENCES dbo.Tickets(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_TicketAttachments_TicketId ON dbo.TicketAttachments(TicketId);
END;
