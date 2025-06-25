import { theories } from "../../../tests/utils";
import { cleanAttachmentDownloadName } from "../attachments";

theories(
    cleanAttachmentDownloadName,
    [   
        // Windows paths
        {in: ["C:\\Users\\Test\\Desktop\\file.txt" ], out: "file.txt"},
        {in: ["D:\\music\\pop\\song.mp3"], out: "song.mp3"},

        // Linux / Unix path
        {in: ["/home/user/docs/test.pdf"], out: "test.pdf"},
        {in: ["/var/log/syslog"], out: "syslog"},

        // Mixed slashes
        {in: ["folder\\subfolder/file.jpg"], out: "file.jpg"},

        // No slashes
        {in: ["filename.txt"], out: "filename.txt"},

        // Trailing slash
        {in: ["C:\\Users\\Test\\Desktop\\"], out: ""},
        {in: ["/home/user/"], out: ""},

        // Edge cases
        {in: [""], out: ""},
        {in: ["////"], out: ""},

    ]
    
)