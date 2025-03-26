#include "../include/secure_syscalls.h"

#define BUFFER_SIZE 256

// Function to create test files at the start
void create_test_files() {
    FILE *file1 = fopen("file1.txt", "w");
    if (file1) {
        fprintf(file1, "This is a test file for Jerome.\n");
        fclose(file1);
    }

    FILE *file2 = fopen("data.txt", "w");
    if (file2) {
        fprintf(file2, "Another test file.\n");
        fclose(file2);
    }
}

int main() {
    create_test_files();
    
    char username[20], filename[100], buffer[BUFFER_SIZE];
    int fd = -1, choice;  // 🔹 Initialize fd to -1

    printf("Enter your username: ");
    scanf("%s", username);
    getchar(); // 🔹 Consume newline after scanf

    while (1) {
        printf("\n1. Open File\n2. Read File\n3. Write to File\n4. Exit\nEnter choice: ");
        if (scanf("%d", &choice) != 1) {  // 🔹 Validate input
            printf("Invalid input! Please enter a number.\n");
            while (getchar() != '\n'); // Clear input buffer
            continue;
        }
        getchar(); // 🔹 Consume newline after number input

        switch (choice) {
            case 1:
                printf("Enter filename to open: ");
                scanf("%s", filename);
                getchar(); // 🔹 Consume newline after filename input

                if (fd > 0) {
                    close(fd);  // 🔹 Close previously opened file to prevent leaks
                }

                fd = secure_open(username, filename, O_RDWR | O_CREAT, 0644);  // 🔹 Added mode (0644)
                if (fd < 0) {
                    printf("Failed to open file.\n");
                }
                break;

            case 2:
                if (fd > 0) {
                    ssize_t bytesRead = secure_read(fd, buffer, BUFFER_SIZE - 1); // 🔹 Keep space for `\0`
                    if (bytesRead > 0) {
                        buffer[bytesRead] = '\0';  // 🔹 Null-terminate before printing
                        printf("File Content:\n%s\n", buffer);
                    } else if (bytesRead == 0) {
                        printf("File is empty.\n");
                    } else {
                        printf("Error reading file.\n");
                    }
                } else {
                    printf("Open a file first!\n");
                }
                break;

            case 3:
                if (fd > 0) {
                    printf("Enter content to write: ");
                    if (fgets(buffer, BUFFER_SIZE, stdin)) {  // 🔹 Prevent buffer overflow
                        buffer[strcspn(buffer, "\n")] = '\0';  // 🔹 Remove newline
                        secure_write(fd, buffer, strlen(buffer));
                        printf("Content written successfully.\n");
                    } else {
                        printf("Error reading input.\n");
                    }
                } else {
                    printf("Open a file first!\n");
                }
                break;

            case 4:
                printf("Exiting...\n");
                if (fd > 0) close(fd);  // 🔹 Close file before exit
                return 0;

            default:
                printf("Invalid choice. Try again.\n");
        }
    }
}
