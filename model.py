import torch
import torch.nn as nn

KERNEL_SIZE=3

class ResidualBlock(nn.Module):
    """
    Residual Temporal Convolution Block.
    """

    def __init__(self, channels, kernel_size=KERNEL_SIZE, dropout=0.2):
        super().__init__()

        padding = kernel_size // 2

        self.block = nn.Sequential(
            nn.Conv1d(
                channels,
                channels,
                kernel_size,
                padding=padding,
            ),
            nn.BatchNorm1d(channels),
            nn.ReLU(inplace=True),

            nn.Conv1d(
                channels,
                channels,
                kernel_size,
                padding=padding,
            ),
            nn.BatchNorm1d(channels),

            nn.Dropout(dropout),
        )

        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):

        residual = x

        x = self.block(x)

        x += residual

        x = self.relu(x)

        return x


class TemporalCNN(nn.Module):
    """
    Temporal CNN for Portfolio Return Prediction.

    Input
    -----
    (batch, window, assets, features)

    Example:
    (32, 30, 3, 18)

    Output
    ------
    (batch, assets)

    Example:
    (32, 3)
    """

    def __init__(
        self,
        num_assets=3,
        features_per_asset=20,
        hidden_channels=64,
        dropout=0.2,
    ):

        super().__init__()

        self.num_assets = num_assets
        self.features_per_asset = features_per_asset
        
        # -----------------------------------------
        # Initial Projection
        # -----------------------------------------

        self.input_projection = nn.Sequential(

            nn.Conv1d(
                features_per_asset,
                hidden_channels,
                kernel_size=KERNEL_SIZE,
                padding=1,
            ),

            nn.BatchNorm1d(hidden_channels),

            nn.ReLU(inplace=True),
        )
        
        # -----------------------------------------
        # Temporal Feature Extraction
        # -----------------------------------------

        self.residual_stack = nn.Sequential(

            ResidualBlock(
                hidden_channels,
                dropout=dropout,
            ),

            ResidualBlock(
                hidden_channels,
                dropout=dropout,
            ),
        )

        # -----------------------------------------
        # Global Temporal Pooling
        # -----------------------------------------

        self.global_pool = nn.AdaptiveAvgPool1d(1)

        # -----------------------------------------
        # Portfolio Head
        # -----------------------------------------

        self.head = nn.Sequential(

            nn.Linear(
                hidden_channels * num_assets,
                128,
            ),

            nn.ReLU(inplace=True),

            nn.Dropout(dropout),

            nn.Linear(
                128,
                num_assets,
            ),
        )
        self._initialize_weights()

    def _initialize_weights(self):

        for m in self.modules():

            if isinstance(m, nn.Conv1d):
                nn.init.kaiming_normal_(m.weight)

                if m.bias is not None:
                    nn.init.zeros_(m.bias)

            elif isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight)

                nn.init.zeros_(m.bias)

    def forward(self, x):

        """
        x

        (batch, window, assets, features)

        ->
        (batch, assets)
        """

        batch_size = x.size(0)

        # -----------------------------------------
        # Process each asset independently
        # -----------------------------------------

        x = x.permute(
            0, 2, 3, 1
        )

        # (batch, assets, features, window)

        x = x.reshape(
            batch_size * self.num_assets,
            self.features_per_asset,
            x.size(-1),
        )

        # (batch*assets, features, window)

        x = self.input_projection(x)

        x = self.residual_stack(x)

        # -----------------------------------------
        # Global Average Pool
        # -----------------------------------------

        x = self.global_pool(x)

        x = x.squeeze(-1)

        # (batch*assets, hidden)

        # -----------------------------------------
        # Restore batch dimension
        # -----------------------------------------

        x = x.reshape(
            batch_size,
            self.num_assets,
            -1,
        )

        # -----------------------------------------
        # Combine all assets
        # -----------------------------------------

        x = x.reshape(
            batch_size,
            -1,
        )

        predictions = self.head(x)

        return predictions


if __name__ == "__main__":

    model = TemporalCNN()

    dummy = torch.randn(
        8,
        30,
        3,
        20,
    )

    out = model(dummy)

    print(model)

    print()

    print("Input :", dummy.shape)

    print("Output:", out.shape)

    criterion = nn.HuberLoss()

    target = torch.randn_like(out)

    loss = criterion(out, target)

    print()

    print("Huber Loss:", loss.item())